const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: bilingualFieldSchema,
  createdAt: { type: Date, default: Date.now }
});

// Method to get review data in specific language
reviewSchema.methods.getLocalizedData = function(language = 'en') {
  const review = this.toObject();
  
  // Convert bilingual fields to single language
  if (review.comment) {
    review.comment = review.comment[language] || review.comment.en;
  }
  
  return review;
};

module.exports = mongoose.model('Review', reviewSchema); 