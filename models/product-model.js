const mongoose = require('mongoose');

// Custom validator to ensure 3–10 custom fields
function arrayLimit(val) {
  return val.length >= 3 && val.length <= 10;
}

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

// Custom field schema with bilingual support
const customFieldSchema = {
  key: bilingualFieldSchema,
  value: bilingualFieldSchema
};

const productSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true
  },
  category: bilingualFieldSchema, // Now bilingual
  // Bilingual name field
  name: bilingualFieldSchema,
  images: [{ type: String }],
  // Bilingual description field
  description: bilingualFieldSchema,
  unit: bilingualFieldSchema, // Now bilingual
  minOrder: { type: Number },
  pricePerUnit: { type: String },
  stock: { type: Number },
  // Remove features and accessories
  // Add attachments: array of product references
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  // Custom key/value sections with bilingual support (minimum 3, max 10)
  customFields: {
    type: [customFieldSchema],
    validate: [arrayLimit, 'Must provide 3-10 custom fields']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  declinedReason: {
    type: String,
    required: function() {
      return this.status === 'declined';
    }
  },
  isAllowed: {
    type: Boolean,
    default: true
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

// Virtual for getting name in current language
productSchema.virtual('nameByLang').get(function() {
  return this.name;
});

// Virtual for getting description in current language
productSchema.virtual('descriptionByLang').get(function() {
  return this.description;
});


// Method to get full bilingual data
productSchema.methods.getBilingualData = function() {
  return this.toObject();
};

module.exports = mongoose.model('Product', productSchema); 