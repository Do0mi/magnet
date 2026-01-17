const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

const bannerSchema = new mongoose.Schema({
  title: bilingualFieldSchema, // Bilingual title
  description: bilingualFieldSchema, // Bilingual description
  imageUrl: { type: String, required: true },
  percentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100 
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - for admin/employee created banners
  },
  isAllowed: {
    type: Boolean,
    default: true
  },
  from: {
    type: Date,
    required: false // Optional - if not set, banner is always available (if isAllowed is true)
  },
  to: {
    type: Date,
    required: false // Optional - if not set, banner is always available (if isAllowed is true)
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt before saving
bannerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Banner', bannerSchema);
