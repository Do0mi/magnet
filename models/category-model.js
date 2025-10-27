const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

const categorySchema = new mongoose.Schema({
  name: bilingualFieldSchema,
  description: bilingualFieldSchema,
  status: {
    type: bilingualFieldSchema,
    default: { en: 'inactive', ar: 'غير نشط' }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create compound unique index for both English and Arabic names
categorySchema.index({ 'name.en': 1 }, { unique: true });
categorySchema.index({ 'name.ar': 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema); 