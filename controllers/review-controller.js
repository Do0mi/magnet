const Review = require('../models/review-model');
const Product = require('../models/product-model');
const { getBilingualMessage } = require('../utils/messages');

// Helper function to format review data
const formatReview = (review) => {
  if (!review) return review;
  return review.toObject ? review.toObject() : review;
};

// Helper to update product average rating
async function updateProductRating(productId) {
  const Review = require('../models/review-model');
  const Product = require('../models/product-model');
  const reviews = await Review.find({ product: productId });
  let avg = 0;
  if (reviews.length > 0) {
    avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    avg = Math.round(avg * 10) / 10; // round to 1 decimal
  }
  await Product.findByIdAndUpdate(productId, { rating: avg });
}

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
    
    // Validate comment if provided
    if (!comment) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('review_comment_required') });
    }
    
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });
    await review.save();
    await updateProductRating(productId);
    
    const formattedReview = formatReview(review);
    
    res.status(201).json({ status: 'success', message: getBilingualMessage('review_added'), data: { review: formattedReview } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_review') });
  }
};

// GET /products/:id/reviews
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const reviews = await Review.find({ product: productId }).populate('user', 'firstname lastname');
    
    const formattedReviews = reviews.map(review => formatReview(review));
    
    res.status(200).json({ status: 'success', data: { reviews: formattedReviews } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_reviews') });
  }
};

// DELETE /reviews/:id
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    const productId = review.product;
    await review.deleteOne();
    await updateProductRating(productId);
    res.status(200).json({ status: 'success', message: getBilingualMessage('review_deleted') });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_review') });
  }
};

// GET /business-products-reviews
exports.getBusinessProductsReviews = async (req, res) => {
  try {
    // First get all products owned by this business user
    const Product = require('../models/product-model');
    const businessProducts = await Product.find({ owner: req.user.id }).select('_id name');
    
    if (!businessProducts || businessProducts.length === 0) {
      return res.status(200).json({ 
        status: 'success', 
        data: { reviews: [] },
        message: getBilingualMessage('no_products_found')
      });
    }
    
    // Get product IDs
    const productIds = businessProducts.map(product => product._id);
    
    // Find reviews for these products
    const reviews = await Review.find({
      product: { $in: productIds }
    }).populate('user', 'firstname lastname email')
      .populate('product', 'name');
    
    const formattedReviews = reviews.map(review => formatReview(review));
    
    res.status(200).json({ 
      status: 'success', 
      data: { reviews: formattedReviews },
      message: getBilingualMessage('business_product_reviews_retrieved')
    });
  } catch (err) {
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_business_product_reviews')
    });
  }
};