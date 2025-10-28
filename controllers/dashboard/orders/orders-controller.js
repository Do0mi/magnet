// Dashboard Orders Controller - Admin/Employee Order Management
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatOrder } = require('../../../utils/response-formatters');

// Helper function to validate admin or magnet employee permissions
const validateAdminOrEmployeePermissions = (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/dashboard/orders - Get all orders
exports.getOrders = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, search, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.firstname': { $regex: search, $options: 'i' } },
        { 'customer.lastname': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } }
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('customer', 'firstname lastname email phone')
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(order => formatOrder(order));

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
    console.error('Get all orders error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_orders')
    });
  }
};

// GET /api/v1/dashboard/orders/:id - Get order by id
exports.getOrderById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstname lastname email phone')
      .populate('items.product', 'name price images description')
      .populate('shippingAddress', 'street city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    const formattedOrder = formatOrder(order);

    res.status(200).json(createResponse('success', { order: formattedOrder }));

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};

// POST /api/v1/dashboard/orders/order - Create an order that contains products to a specific user
exports.createOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { customerId, items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // Check if customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('customer_not_found')
      });
    }

    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('product_not_found')
        });
      }

      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        total: itemTotal
      });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const order = new Order({
      orderNumber,
      customer: customerId,
      items: validatedItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'admin_created',
      status: 'confirmed',
      adminNotes: notes,
      createdBy: req.user.id
    });

    await order.save();

    await order.populate('customer', 'firstname lastname email phone');
    await order.populate('items.product', 'name price images');

    const formattedOrder = formatOrder(order);

    res.status(201).json(createResponse('success', {
      order: formattedOrder
    }, getBilingualMessage('order_created_success')));

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_order')
    });
  }
};

// PUT /api/v1/dashboard/orders/order/:id - Update an order that contains products to a specific user
exports.updateOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { items, shippingAddress, paymentMethod, notes, status } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (items && Array.isArray(items)) {
      // Recalculate total if items are updated
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('product_not_found')
          });
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          product: product._id,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal
        });
      }

      updateFields.items = validatedItems;
      updateFields.totalAmount = totalAmount;
    }

    if (shippingAddress) updateFields.shippingAddress = shippingAddress;
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;
    if (notes) updateFields.adminNotes = notes;
    if (status) updateFields.status = status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstname lastname email phone')
      .populate('items.product', 'name price images');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    const formattedOrder = formatOrder(order);

    res.status(200).json(createResponse('success', {
      order: formattedOrder
    }, getBilingualMessage('order_updated_success')));

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_order')
    });
  }
};

// DELETE /api/v1/dashboard/orders/order/:id - Delete an order that contains products to a specific user
exports.deleteOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('order_deleted_success')));

  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_order')
    });
  }
};
