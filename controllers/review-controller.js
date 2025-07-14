const Review = require('../models/review-model');
const Product = require('../models/product-model');
const { getBilingualMessage } = require('../utils/messages');

// POST /products/:id/reviews
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;
    // Check if product exists and is approved
    const product = await Product.findById(productId);
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found_or_not_approved') });
    }
    // Prevent duplicate reviews by same user
    const existing = await Review.findOne({ product: productId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('already_reviewed_product') });
    }
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });
    await review.save();
    res.status(201).json({ status: 'success', message: getBilingualMessage('review_added'), data: { review } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_review') });
  }
};

// GET /products/:id/reviews
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const reviews = await Review.find({ product: productId }).populate('user', 'firstname lastname');
    res.status(200).json({ status: 'success', data: { reviews } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_reviews') });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    await review.deleteOne();
    res.status(200).json({ status: 'success', message: getBilingualMessage('review_deleted') });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_review') });
  }
}; 