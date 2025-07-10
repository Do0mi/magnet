const Order = require('../models/order-model');
const Product = require('../models/product-model');

// POST /orders
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Order must have at least one item' });
    }
    // Optionally: check product availability, etc.
    const order = new Order({
      customer: req.user.id,
      items,
      shippingAddress,
      status: 'pending',
      statusLog: [{ status: 'pending', timestamp: new Date() }]
    });
    await order.save();
    res.status(201).json({ status: 'success', message: 'Order created', data: { order } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to create order' });
  }
};

// GET /orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id }).populate('items.product').populate('shippingAddress');
    res.status(200).json({ status: 'success', data: { orders } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get orders' });
  }
};

// GET /orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product').populate('shippingAddress');
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    // Only admin, magnet_employee, or owner (customer) can view
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee' && order.customer.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to view this order' });
    }
    res.status(200).json({ status: 'success', data: { order } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get order' });
  }
};

// GET /orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('items.product').populate('shippingAddress');
    res.status(200).json({ status: 'success', data: { orders } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get orders' });
  }
};

// PUT /orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ status: 'error', message: 'Invalid status' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ status: 'error', message: 'Order not found' });
    order.status = status;
    order.statusLog.push({ status, timestamp: new Date() });
    order.updatedAt = new Date();
    await order.save();
    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    io.to(`order_${order._id}`).emit('orderStatusUpdate', {
      orderId: order._id,
      status: order.status,
      statusLog: order.statusLog,
      updatedAt: order.updatedAt
    });
    res.status(200).json({ status: 'success', message: 'Order status updated', data: { order } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update order status' });
  }
}; 