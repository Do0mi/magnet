const mongoose = require('mongoose');

// Custom validator to ensure 5–10 custom fields
function arrayLimit(val) {
  return val.length >= 5 && val.length <= 10;
}

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true
  },
  category: { type: String, required: true },
  name: { type: String, required: true },
  images: [{ type: String }],
  description: { type: String },
  color: { type: String },
  unit: { type: String },
  minOrder: { type: Number },
  pricePerUnit: { type: String },
  stock: { type: Number },
  // Remove features and accessories
  // Add attachments: array of product references
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  // Custom key/value sections (minimum 5, max 10)
  customFields: {
    type: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true }
      }
    ],
    validate: [arrayLimit, 'Must provide 5-10 custom fields']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema); 