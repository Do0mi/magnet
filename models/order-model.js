const mongoose = require('mongoose');

const statusLogSchema = new mongoose.Schema({
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], required: true },
  timestamp: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }
  ],
  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
  statusLog: [statusLogSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema); 