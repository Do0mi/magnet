const Order = require('../models/order-model');
const Product = require('../models/product-model');
const { getBilingualMessage } = require('../utils/messages');
const { formatOrder, createResponse } = require('../utils/response-formatters');

// Legacy formatOrder function - now using the one from response-formatters
const legacyFormatOrder = (order, language = 'en') => {
  if (!order) return order;
  
  // Use the model's built-in localization method
  return order.getLocalizedData(language);
};

// POST /orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('order_must_have_items') });
    }
    
    // Convert English status to bilingual format using model's static method
    const bilingualStatus = Order.convertStatusToBilingual('pending');
    
    // Optionally: check product availability, etc.
    const order = new Order({
      customer: req.user.id,
      items,
      shippingAddress,
      status: bilingualStatus,
      statusLog: [{ 
        status: bilingualStatus, 
        timestamp: new Date(),
        updatedBy: req.user.id
      }]
    });
    await order.save();
    
    const language = req.query.lang || 'en';
    const formattedOrder = formatOrder(order, { language });
    
    res.status(201).json(createResponse('success', 
      { order: formattedOrder },
      getBilingualMessage('order_created')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_order') });
  }
};

// GET /orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const orders = await Order.find({ customer: req.user.id })
      .populate('customer', 'firstname lastname email role')
      .populate('items.product')
      .populate('shippingAddress');
    
    const formattedOrders = orders.map(order => formatOrder(order, { language }));
    
    res.status(200).json(createResponse('success', { orders: formattedOrders }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_orders') });
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const order = await Order.findById(req.params.id)
      .populate('customer', 'firstname lastname email role')
      .populate('items.product')
      .populate('shippingAddress');
    if (!order) return res.status(404).json({ status: 'error', message: getBilingualMessage('order_not_found') });
    // Only admin, magnet_employee, or owner (customer) can view
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_view_order') });
    }
    
    const formattedOrder = formatOrder(order, { language });
    
    res.status(200).json(createResponse('success', { order: formattedOrder }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_order') });
  }
};

// GET /orders
exports.getAllOrders = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const orders = await Order.find()
      .populate('customer', 'firstname lastname email role')
      .populate('items.product')
      .populate('shippingAddress');
    
    const formattedOrders = orders.map(order => formatOrder(order, { language }));
    
    res.status(200).json(createResponse('success', { orders: formattedOrders }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_orders') });
  }
};

// PUT /orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Use model's validation method instead of hardcoded array
    if (!Order.isValidStatus(status)) {
      const validStatuses = Order.getValidEnglishStatuses().join(', ');
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('invalid_order_status'),
        data: { validStatuses }
      });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ status: 'error', message: getBilingualMessage('order_not_found') });
    
    // Convert English status to bilingual format using model's static method
    const bilingualStatus = Order.convertStatusToBilingual(status);
    
    order.status = bilingualStatus;
    order.statusLog.push({ 
      status: bilingualStatus, 
      timestamp: new Date(),
      updatedBy: req.user.id
    });
    order.updatedAt = new Date();
    await order.save();
    
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: order.status, // This will be the bilingual object
      statusLog: order.statusLog, // This will contain bilingual objects
      updatedAt: order.updatedAt
    });
    
    const language = req.query.lang || 'en';
    const formattedOrder = formatOrder(order, { language }); // This will localize the status for the response
    
    res.status(200).json(createResponse('success', 
      { order: formattedOrder },
      getBilingualMessage('order_status_updated')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_order_status') });
  }
}; 

// GET /orders/status-options
exports.getStatusOptions = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const statusMapping = Order.getStatusMapping();
    const statusEnums = Order.getStatusEnums();
    
    let statusOptions;
    if (language === 'both') {
      statusOptions = statusMapping;
    } else {
      statusOptions = Object.keys(statusMapping).reduce((acc, key) => {
        acc[key] = statusMapping[key][language] || statusMapping[key].en;
        return acc;
      }, {});
    }
    
    res.status(200).json(createResponse('success', { 
      statusOptions,
      statusEnums, // Include the enums for reference
      validEnglishStatuses: Order.getValidEnglishStatuses()
    }, getBilingualMessage('status_options_retrieved')));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_status_options') });
  }
};

// GET /orders/business-products
exports.getBusinessProductOrders = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    
    // First get all products owned by this business user
    const Product = require('../models/product-model');
    const businessProducts = await Product.find({ owner: req.user.id }).select('_id');
    
    if (!businessProducts || businessProducts.length === 0) {
      return res.status(200).json(createResponse('success', 
        { orders: [] },
        getBilingualMessage('no_products_found')
      ));
    }
    
    // Get product IDs
    const productIds = businessProducts.map(product => product._id);
    
    // Find orders containing any of these products
    const orders = await Order.find({
      'items.product': { $in: productIds }
    }).populate('items.product')
      .populate('customer', 'firstname lastname email phone role')
      .populate('shippingAddress');
    
    const formattedOrders = orders.map(order => formatOrder(order, { language }));
    
    res.status(200).json(createResponse('success', 
      { orders: formattedOrders },
      getBilingualMessage('business_product_orders_retrieved')
    ));
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_business_product_orders')
    });
  }
};