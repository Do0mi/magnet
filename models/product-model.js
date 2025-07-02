const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  rate: { type: Number, default: 0 },
  amount: { type: Number, required: true },
  inStock: { type: Boolean, default: true },
  isApprove: { type: Boolean, default: false },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

module.exports = mongoose.model('Product', productSchema); 