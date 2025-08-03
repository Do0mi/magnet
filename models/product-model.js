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

// Method to get product data in specific language
productSchema.methods.getLocalizedData = function(language = 'en') {
  const product = this.toObject();
  
  // If language is 'both', return the bilingual objects as they are
  if (language === 'both') {
    return product;
  }
  
  // Convert bilingual fields to single language
  if (product.name) {
    product.name = product.name[language] || product.name.en;
  }
  if (product.description) {
    product.description = product.description[language] || product.description.en;
  }
  if (product.category) {
    product.category = product.category[language] || product.category.en;
  }
  if (product.unit) {
    product.unit = product.unit[language] || product.unit.en;
  }
  if (product.customFields) {
    product.customFields = product.customFields.map(field => ({
      key: field.key[language] || field.key.en,
      value: field.value[language] || field.value.en
    }));
  }
  
  return product;
};

// Method to get full bilingual data
productSchema.methods.getBilingualData = function() {
  return this.toObject();
};

module.exports = mongoose.model('Product', productSchema); 