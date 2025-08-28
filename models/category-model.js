const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

const categorySchema = new mongoose.Schema({
  name: bilingualFieldSchema,
  description: bilingualFieldSchema,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound unique index for both English and Arabic names
categorySchema.index({ 'name.en': 1 }, { unique: true });
categorySchema.index({ 'name.ar': 1 }, { unique: true });

// Method to get category data in specific language
categorySchema.methods.getLocalizedData = function(language = 'en') {
  const category = this.toObject();
  
  // If language is 'both', return the bilingual objects as they are
  if (language === 'both') {
    return category;
  }
  
  // Convert bilingual fields to single language
  if (category.name) {
    category.name = category.name[language] || category.name.en;
  }
  if (category.description) {
    category.description = category.description[language] || category.description.en;
  }
  
  return category;
};

module.exports = mongoose.model('Category', categorySchema); 