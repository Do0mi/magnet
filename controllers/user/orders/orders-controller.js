// User Orders Controller - User Order Management
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate customer permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};


// POST /api/v1/user/orders - Create order (Customer)
exports.createOrder = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { items, shippingAddress, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('items_required')
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('shipping_address_required')
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

      if (product.status !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('product_not_available')
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('insufficient_stock')
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
      customer: req.user.id,
      items: validatedItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'pending',
      notes
    });

    await order.save();

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    await order.populate('items.product', 'name price images');
    await order.populate('shippingAddress', 'street city state postalCode country');

    res.status(201).json(createResponse('success', {
      order
    }, getBilingualMessage('order_created_success')));

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_order')
    });
  }
};

// GET /api/v1/user/orders - Get all customer's orders
exports.getOrders = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object - only user's orders
    const filter = { customer: req.user.id };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(filter)
      .populate('items.product', 'name price images')
      .populate('shippingAddress', 'street city state postalCode country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_orders')
    });
  }
};

// GET /api/v1/user/orders/:id - Get a specific customer's order
exports.getOrderById = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    })
      .populate('items.product', 'name price images description')
      .populate('shippingAddress', 'street city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    res.status(200).json(createResponse('success', { order }));

  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};

// PUT /api/v1/user/orders/order/:id - Update an existing order
exports.updateOrder = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { items, shippingAddress, notes } = req.body;

    // Check if order exists and belongs to customer
    const existingOrder = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    });

    if (!existingOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Only allow updates if order is pending or confirmed
    if (!['pending', 'confirmed'].includes(existingOrder.status)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('order_cannot_be_updated')
      });
    }

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

        if (product.status !== 'approved') {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('product_not_available')
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
    if (notes) updateFields.notes = notes;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('items.product', 'name price images')
      .populate('shippingAddress', 'street city state postalCode country');

    res.status(200).json(createResponse('success', {
      order
    }, getBilingualMessage('order_updated_success')));

  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_order')
    });
  }
};

// PUT /api/v1/user/orders/order/:id/cancel - Cancel an order
exports.cancelOrder = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Only allow cancellation if order is not shipped or delivered
    if (['shipped', 'delivered'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('order_cannot_be_cancelled')
      });
    }

    // Update order status to cancelled
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'cancelled',
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    )
      .populate('items.product', 'name price images')
      .populate('shippingAddress', 'street city state postalCode country');

    // Restore product stock
    for (const item of updatedOrder.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    res.status(200).json(createResponse('success', {
      order: updatedOrder
    }, getBilingualMessage('order_cancelled_success')));

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_cancel_order')
    });
  }
};
