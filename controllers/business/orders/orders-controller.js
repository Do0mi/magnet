// Business Orders Controller - Business Order Management
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatOrder } = require('../../../utils/response-formatters');

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
    const skip = (page - 1) * limit;

    // Get all products owned by this business
    const businessProducts = await Product.find({ owner: req.user.id }).select('_id');
    const businessProductIds = businessProducts.map(p => p._id);

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

    const orders = await Order.find(filter)
      .populate('customer', 'firstname lastname email phone')
      .populate('items.product', 'name price images owner')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter orders to only include items with business products
    const filteredOrders = orders.map(order => {
      const businessItems = order.items.filter(item => 
        businessProductIds.includes(item.product._id)
      );
      return {
        ...order.toObject(),
        items: businessItems
      };
    });

    const total = await Order.countDocuments(filter);

    const formattedOrders = filteredOrders.map(order => formatOrder(order));

    res.status(200).json(createResponse('success', {
      orders: formattedOrders,
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

    const { order, isOwner } = await checkOrderOwnership(req.params.id, req.user.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    // Filter to only show business products in the order
    const businessProductIds = await Product.find({ owner: req.user.id }).select('_id');
    const businessProductIdStrings = businessProductIds.map(p => p._id.toString());
    
    const filteredOrder = {
      ...order.toObject(),
      items: order.items.filter(item => 
        businessProductIdStrings.includes(item.product._id.toString())
      )
    };

    const formattedOrder = formatOrder(filteredOrder);

    res.status(200).json(createResponse('success', { 
      order: formattedOrder 
    }));

  } catch (error) {
    console.error('Get business order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};
