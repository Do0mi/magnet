// User Orders Controller - User Order Management
const mongoose = require('mongoose');
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const Address = require('../../../models/address-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');
const { convertCurrency, BASE_CURRENCY } = require('../../../services/currency-service');
const { sendNotification } = require('../../../services/fcm-service');
const { getBilingualNotification } = require('../../../utils/notification-messages');

// Helper function to validate customer or business permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer' && req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

/**
 * Format order with currency conversion
 * Converts all prices (product prices, unitPrice, itemTotal, subtotal, total, shippingCost)
 * 
 * @param {Object} order - Order document
 * @param {string} userCurrency - Target currency code
 * @returns {Promise<Object>} Formatted order with converted prices
 */
const formatOrderWithCurrency = async (order, userCurrency) => {
  // Convert items with product prices
  const convertedItems = await Promise.all(
    order.items.map(async (item) => {
      let product = item.product;
      
      // Format and convert product if it's an object
      if (product && typeof product === 'object') {
        const formatted = formatProduct(product, {
          includeOwner: false,
          includeApproval: false
        });
        
        // Convert pricePerUnit if it exists
        if (formatted.pricePerUnit) {
          const basePrice = parseFloat(formatted.pricePerUnit);
          if (!isNaN(basePrice)) {
            const convertedPrice = await convertCurrency(basePrice, userCurrency);
            formatted.pricePerUnit = convertedPrice.toString();
          }
        }
        
        product = formatted;
      }

      // Convert unitPrice and itemTotal
      const convertedUnitPrice = await convertCurrency(item.unitPrice || 0, userCurrency);
      const convertedItemTotal = await convertCurrency(item.itemTotal || 0, userCurrency);

      return {
        id: item._id,
        product,
        quantity: item.quantity,
        unitPrice: convertedUnitPrice,
        itemTotal: convertedItemTotal
      };
    })
  );

  // Convert totals
  const convertedSubtotal = await convertCurrency(order.subtotal || 0, userCurrency);
  const convertedShippingCost = await convertCurrency(order.shippingCost || 0, userCurrency);
  const convertedTotal = await convertCurrency(order.total || 0, userCurrency);

  return {
    id: order._id,
    orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
    customer: {
      id: order.customer._id || order.customer,
      name: (order.customer.firstname && order.customer.lastname) 
        ? `${order.customer.firstname} ${order.customer.lastname}`.trim()
        : (order.customer.fullName || 'Unknown User'),
      email: order.customer.email
    },
    items: convertedItems,
    subtotal: convertedSubtotal,
    shippingCost: convertedShippingCost,
    total: convertedTotal,
    shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object'
      ? {
          id: order.shippingAddress._id || order.shippingAddress,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country
        }
      : (order.shippingAddress || null),
    status: order.status,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    currency: userCurrency
  };
};


// POST /api/v1/user/orders - Create order (Customer or Business)
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

    // Validate shipping address exists and belongs to user
    if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_address_id')
      });
    }

    const address = await Address.findById(shippingAddress);
    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }

    if (address.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('address_not_belongs_to_user')
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

      const unitPrice = parseFloat(product.pricePerUnit);
      
      if (isNaN(unitPrice) || unitPrice <= 0) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_product_price')
        });
      }

      const itemTotal = unitPrice * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: unitPrice,
        itemTotal: itemTotal
      });
    }

    const order = new Order({
      customer: req.user.id,
      items: validatedItems,
      subtotal: totalAmount,
      total: totalAmount,
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

    await order.populate('customer', 'firstname lastname email');
    await order.populate('items.product', 'name pricePerUnit images');
    await order.populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format the order response with currency conversion
    const formattedOrder = await formatOrderWithCurrency(order, userCurrency);

    // Send notification to customer
    try {
      const orderNumber = `ORD-${order._id.toString().slice(-8).toUpperCase()}`;
      const notification = getBilingualNotification(
        'notification_order_placed',
        'notification_order_placed_message',
        { orderNumber }
      );
      await sendNotification(
        order.customer._id.toString() || order.customer.toString(),
        notification.title,
        notification.message,
        {
          type: 'order',
          url: `/orders?orderId=${order._id}`,
          orderId: order._id.toString(),
          orderNumber: orderNumber
        }
      );
    } catch (notificationError) {
      console.error('Failed to send order notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json(createResponse('success', {
      order: formattedOrder,
      currency: userCurrency
    }, getBilingualMessage('order_created_success')));

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_order')
    });
  }
};

// GET /api/v1/user/orders - Get all user's orders (Customer or Business)
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
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format orders response with currency conversion
    const formattedOrders = await Promise.all(
      orders.map(order => formatOrderWithCurrency(order, userCurrency))
    );

    res.status(200).json(createResponse('success', {
      orders: formattedOrders,
      currency: userCurrency,
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

// GET /api/v1/user/orders/:id - Get a specific user's order (Customer or Business)
exports.getOrderById = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const order = await Order.findOne({
      _id: req.params.id,
      customer: req.user.id
    })
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images description')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format the order response with currency conversion
    const formattedOrder = await formatOrderWithCurrency(order, userCurrency);

    res.status(200).json(createResponse('success', { 
      order: formattedOrder,
      currency: userCurrency
    }));

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

    // Check if order exists and belongs to user
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
      // Restore stock from old items first
      for (const oldItem of existingOrder.items) {
        await Product.findByIdAndUpdate(
          oldItem.product,
          { $inc: { stock: oldItem.quantity } }
        );
      }

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

        // Check stock availability
        if (typeof product.stock === 'number' && product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('insufficient_stock')
          });
        }

        const unitPrice = parseFloat(product.pricePerUnit);
        
        if (isNaN(unitPrice) || unitPrice <= 0) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('invalid_product_price')
          });
        }

        const itemTotal = unitPrice * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          product: product._id,
          quantity: item.quantity,
          unitPrice: unitPrice,
          itemTotal: itemTotal
        });
      }

      // Deduct stock for new items
      for (const item of validatedItems) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: -item.quantity } }
        );
      }

      updateFields.items = validatedItems;
      updateFields.subtotal = totalAmount;
      updateFields.total = totalAmount;
    }

    if (shippingAddress) {
      // Validate shipping address exists and belongs to user
      if (!mongoose.Types.ObjectId.isValid(shippingAddress)) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_address_id')
        });
      }

      const address = await Address.findById(shippingAddress);
      if (!address) {
        return res.status(404).json({
          status: 'error',
          message: getBilingualMessage('address_not_found')
        });
      }

      if (address.user.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: getBilingualMessage('address_not_belongs_to_user')
        });
      }

      updateFields.shippingAddress = shippingAddress;
    }
    if (notes) updateFields.notes = notes;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format the order response with currency conversion
    const formattedOrder = await formatOrderWithCurrency(order, userCurrency);

    res.status(200).json(createResponse('success', {
      order: formattedOrder,
      currency: userCurrency
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
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    if (!updatedOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Restore product stock
    for (const item of updatedOrder.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } }
      );
    }

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format the order response with currency conversion
    const formattedOrder = await formatOrderWithCurrency(updatedOrder, userCurrency);

    // Send notification to customer
    try {
      const orderNumber = `ORD-${updatedOrder._id.toString().slice(-8).toUpperCase()}`;
      const notification = getBilingualNotification(
        'notification_order_cancelled',
        'notification_order_cancelled_message',
        { orderNumber }
      );
      await sendNotification(
        updatedOrder.customer._id.toString() || updatedOrder.customer.toString(),
        notification.title,
        notification.message,
        {
          type: 'order_cancelled',
          url: `/orders?orderId=${updatedOrder._id}`,
          orderId: updatedOrder._id.toString(),
          orderNumber: orderNumber
        }
      );
    } catch (notificationError) {
      console.error('Failed to send cancellation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json(createResponse('success', {
      order: formattedOrder,
      currency: userCurrency
    }, getBilingualMessage('order_cancelled_success')));

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_cancel_order')
    });
  }
};
