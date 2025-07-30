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

// Method to get category data in specific language
categorySchema.methods.getLocalizedData = function(language = 'en') {
  const category = this.toObject();
  
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