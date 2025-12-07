// Dashboard Orders Controller - Admin/Employee Order Management
const Order = require('../../../models/order-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatOrder } = require('../../../utils/response-formatters');
const { sendNotification } = require('../../../services/fcm-service');

// Base currency for dashboard (always USD)
const BASE_CURRENCY = 'USD';

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
      .populate('customer', 'firstname lastname email phone imageUrl')
      .populate('items.product', 'name price images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    const formattedOrders = orders.map(order => formatOrder(order));

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
      .populate('customer', 'firstname lastname email phone imageUrl')
      .populate('items.product', 'name price images description')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    const formattedOrder = formatOrder(order);

    res.status(200).json(createResponse('success', { 
      order: formattedOrder,
      currency: BASE_CURRENCY
    }));

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

    const { customerId, items, shippingAddress, shippingCost, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('shipping_address_required')
      });
    }

    // Check if customer exists and is a customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('customer_not_found')
      });
    }

    if (customer.role !== 'customer') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('user_not_customer')
      });
    }

    // Validate shipping address exists and belongs to customer
    const Address = require('../../../models/address-model');
    const addressDoc = await Address.findById(shippingAddress);
    if (!addressDoc) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }
    
    // Verify address belongs to customer
    if (addressDoc.user.toString() !== customerId.toString()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('address_not_belong_to_customer')
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

    const statusMapping = Order.getStatusMapping();
    const confirmedStatus = statusMapping['confirmed'];

    const order = new Order({
      customer: customerId,
      items: validatedItems,
      subtotal: totalAmount,
      total: totalAmount + (shippingCost || 0),
      shippingAddress: shippingAddress,
      shippingCost: shippingCost || 0,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      status: 'confirmed',
      notes: notes,
      statusLog: [{
        status: confirmedStatus,
        timestamp: new Date(),
        updatedBy: req.user.id,
        note: 'Order created by admin/employee'
      }]
    });

    await order.save();

    // Update product stock
    for (const item of validatedItems) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } }
      );
    }

    await order.populate('customer', 'firstname lastname email phone imageUrl');
    await order.populate('items.product', 'name pricePerUnit images');
    await order.populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    // Send notification to customer
    try {
      const orderNumber = `ORD-${order._id.toString().slice(-8).toUpperCase()}`;
      await sendNotification(
        order.customer._id.toString() || order.customer.toString(),
        'Order Confirmed',
        `Your order ${orderNumber} has been confirmed`,
        {
          type: 'order_confirmed',
          url: `/orders?orderId=${order._id}`,
          orderId: order._id.toString(),
          orderNumber: orderNumber
        }
      );
    } catch (notificationError) {
      console.error('Failed to send order confirmation notification:', notificationError);
      // Don't fail the request if notification fails
    }

    // Format the order response
    const formattedOrder = {
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: {
        id: order.customer._id || order.customer,
        firstname: order.customer.firstname,
        lastname: order.customer.lastname,
        email: order.customer.email,
        phone: order.customer.phone || null,
        imageUrl: order.customer.imageUrl || null
      },
      items: order.items.map(item => ({
        id: item._id,
        product: {
          id: item.product._id,
          name: item.product.name,
          images: item.product.images,
          pricePerUnit: item.product.pricePerUnit
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost || 0,
      total: order.total,
      shippingAddress: order.shippingAddress ? {
        id: order.shippingAddress._id,
        addressLine1: order.shippingAddress.addressLine1,
        ...(order.shippingAddress.addressLine2 && { addressLine2: order.shippingAddress.addressLine2 }),
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(201).json(createResponse('success', {
      order: formattedOrder,
      currency: BASE_CURRENCY
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

    const { items, shippingAddress, paymentMethod, notes, status, shippingCost } = req.body;

    // Check if order exists
    const existingOrder = await Order.findById(req.params.id);

    if (!existingOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
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

      updateFields.items = validatedItems;
      updateFields.subtotal = totalAmount;
      const finalShippingCost = shippingCost !== undefined ? shippingCost : existingOrder.shippingCost || 0;
      updateFields.shippingCost = finalShippingCost;
      updateFields.total = totalAmount + finalShippingCost;
    } else if (shippingCost !== undefined) {
      // If only shipping cost is updated
      updateFields.shippingCost = shippingCost;
      updateFields.total = (existingOrder.subtotal || 0) + shippingCost;
    }

    if (shippingAddress !== undefined) {
      if (shippingAddress) {
        // Validate shipping address exists
        const Address = require('../../../models/address-model');
        const addressDoc = await Address.findById(shippingAddress);
        if (!addressDoc) {
          return res.status(404).json({
            status: 'error',
            message: getBilingualMessage('address_not_found')
          });
        }
        
        // Verify address belongs to customer
        const customerId = existingOrder.customer._id ? existingOrder.customer._id.toString() : existingOrder.customer.toString();
        if (addressDoc.user.toString() !== customerId) {
          return res.status(400).json({
            status: 'error',
            message: getBilingualMessage('address_not_belong_to_customer')
          });
        }
        
        updateFields.shippingAddress = shippingAddress;
      } else {
        updateFields.shippingAddress = null;
      }
    }
    if (paymentMethod) updateFields.paymentMethod = paymentMethod;
    if (notes) updateFields.notes = notes;
    
    // Track if status changed for notification
    const oldStatus = existingOrder.status;
    if (status) updateFields.status = status;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstname lastname email phone imageUrl')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    // Send notification if status changed
    if (status && status !== oldStatus) {
      try {
        const orderNumber = `ORD-${order._id.toString().slice(-8).toUpperCase()}`;
        const statusMessages = {
          'confirmed': { 
            title: 'Order Confirmed', 
            message: `Your order ${orderNumber} has been confirmed`,
            type: 'order_confirmed'
          },
          'shipped': { 
            title: 'Order Shipped', 
            message: `Your order ${orderNumber} has been shipped`,
            type: 'order_shipped'
          },
          'delivered': { 
            title: 'Order Delivered', 
            message: `Your order ${orderNumber} has been delivered`,
            type: 'order_delivered'
          },
          'cancelled': { 
            title: 'Order Cancelled', 
            message: `Your order ${orderNumber} has been cancelled`,
            type: 'order_cancelled'
          }
        };
        
        const notification = statusMessages[status];
        if (notification) {
          await sendNotification(
            order.customer._id.toString() || order.customer.toString(),
            notification.title,
            notification.message,
            {
              type: notification.type,
              url: `/orders?orderId=${order._id}`,
              orderId: order._id.toString(),
              orderNumber: orderNumber
            }
          );
        }
      } catch (notificationError) {
        console.error('Failed to send order status notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    // Format the order response
    const formattedOrder = {
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: {
        id: order.customer._id || order.customer,
        firstname: order.customer.firstname,
        lastname: order.customer.lastname,
        email: order.customer.email,
        phone: order.customer.phone || null,
        imageUrl: order.customer.imageUrl || null
      },
      items: order.items.map(item => ({
        id: item._id,
        product: {
          id: item.product._id,
          name: item.product.name,
          images: item.product.images,
          pricePerUnit: item.product.pricePerUnit
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost || 0,
      total: order.total,
      shippingAddress: order.shippingAddress ? {
        id: order.shippingAddress._id,
        addressLine1: order.shippingAddress.addressLine1,
        ...(order.shippingAddress.addressLine2 && { addressLine2: order.shippingAddress.addressLine2 }),
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json(createResponse('success', {
      order: formattedOrder,
      currency: BASE_CURRENCY
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
