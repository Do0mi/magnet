// Business Orders Controller - Business Order Management
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatOrder } = require('../../../utils/response-formatters');

// Base currency for business (always USD)
const BASE_CURRENCY = 'USD';

// Helper function to validate business permissions
const validateBusinessPermissions = (req, res) => {
  if (req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// Helper function to check if order contains business products
const checkOrderOwnership = async (orderId, businessId) => {
  const order = await Order.findById(orderId)
    .populate('items.product', 'owner');
  
  if (!order) return { order: null, isOwner: false };
  
  const ownsProduct = order.items.some(item => 
    item.product && item.product.owner && item.product.owner.toString() === businessId
  );
  
  return { order, isOwner: ownsProduct };
};

// GET /api/v1/business/orders - Get business user orders that contain their own products
exports.getOrders = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, search } = req.query;

    // Get all products owned by this business
    const businessProducts = await Product.find({ owner: req.user.id }).select('_id');
    const businessProductIds = businessProducts.map(p => p._id);

    // If no business products, return empty result
    if (businessProductIds.length === 0) {
      return res.status(200).json(createResponse('success', {
        orders: [],
        currency: BASE_CURRENCY,
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalOrders: 0,
          limit: parseInt(limit)
        }
      }));
    }

    // Build filter object - only orders containing business products
    const filter = {
      'items.product': { $in: businessProductIds }
    };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.firstname': { $regex: search, $options: 'i' } },
        { 'customer.lastname': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch all matching orders (we'll filter and paginate after)
    const allOrders = await Order.find(filter)
      .populate('customer', 'firstname lastname email phone imageUrl')
      .populate('items.product', 'name price images owner')
      .sort({ createdAt: -1 });

    // Filter orders to only include items with business products
    // Convert businessProductIds to strings for comparison
    const businessProductIdsStr = businessProductIds.map(id => id.toString());
    
    const filteredOrders = allOrders
      .map(order => {
        const businessItems = order.items.filter(item => {
          if (!item.product || !item.product._id) return false;
          const productIdStr = item.product._id.toString();
          return businessProductIdsStr.includes(productIdStr);
        });
        
        // Only return order if it has business items
        if (businessItems.length === 0) return null;
        
        return {
          ...order.toObject(),
          items: businessItems
        };
      })
      .filter(order => order !== null); // Remove orders with no business items

    // Apply pagination after filtering
    const total = filteredOrders.length;
    const skip = (page - 1) * limit;
    const paginatedOrders = filteredOrders.slice(skip, skip + parseInt(limit));

    const formattedOrders = paginatedOrders.map(order => formatOrder(order));

    res.status(200).json(createResponse('success', {
      orders: formattedOrders,
      currency: BASE_CURRENCY,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get business product orders error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_orders')
    });
  }
};

// GET /api/v1/business/orders/:id - Get order by id
exports.getOrderById = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    // Get business product IDs
    const businessProductIds = await Product.find({ owner: req.user.id }).select('_id');
    const businessProductIdStrings = businessProductIds.map(p => p._id.toString());

    if (businessProductIdStrings.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Find order first without populate to get raw shippingAddress
    const orderRaw = await Order.findById(req.params.id).lean();
    
    if (!orderRaw) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Find order with populate for customer and products
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstname lastname email phone imageUrl')
      .populate('items.product');

    // Filter items to only include business products
    const businessItems = order.items.filter(item => {
      if (!item.product || !item.product._id) return false;
      return businessProductIdStrings.includes(item.product._id.toString());
    });

    // If no business items found, return 403
    if (businessItems.length === 0) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    // Handle shippingAddress - use raw order data to get ObjectId
    // This matches the behavior in getOrders where formatOrder handles ObjectId
    // formatOrder returns { id: ... } when shippingAddress is an ObjectId
    let shippingAddress = null;
    
    // Get shippingAddress from raw order (before populate)
    const rawShippingAddress = orderRaw.shippingAddress;
    
    if (rawShippingAddress) {
      // In lean() result, shippingAddress is either ObjectId or string
      // Convert to string to get the ID
      let addressId = null;
      
      if (typeof rawShippingAddress === 'string') {
        addressId = rawShippingAddress;
      } else if (rawShippingAddress && typeof rawShippingAddress.toString === 'function') {
        // Mongoose ObjectId
        addressId = rawShippingAddress.toString();
      } else if (rawShippingAddress._id || rawShippingAddress.id) {
        // In case it's already an object with id
        addressId = (rawShippingAddress._id || rawShippingAddress.id).toString();
      }
      
      // Only set if we have a valid ID
      if (addressId && addressId !== 'null' && addressId !== 'undefined' && addressId.length === 24) {
        shippingAddress = {
          id: addressId
        };
      }
    }

    // Format the response according to the required structure
    const formattedOrder = {
      id: order._id,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      status: order.status,
      paymentMethod: order.paymentMethod || null,
      notes: order.notes || null,
      customer: order.customer ? {
        id: order.customer._id,
        firstname: order.customer.firstname,
        lastname: order.customer.lastname,
        email: order.customer.email,
        phone: order.customer.phone || null,
        imageUrl: order.customer.imageUrl || null
      } : null,
      shippingAddress: shippingAddress,
      items: businessItems.map(item => {
        const product = item.product;
        return {
          product: {
            id: product._id,
            images: product.images || [],
            name: product.name || { en: '', ar: '' }
          },
          quantity: item.quantity,
          itemTotal: item.itemTotal || 0
        };
      }),
      total: businessItems.reduce((sum, item) => sum + (item.itemTotal || 0), 0)
    };

    res.status(200).json(createResponse('success', { 
      order: formattedOrder,
      currency: BASE_CURRENCY
    }));

  } catch (error) {
    console.error('Get business order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};
