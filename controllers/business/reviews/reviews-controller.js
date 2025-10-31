// Business Reviews Controller - Business Review Management
const Review = require('../../../models/review-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatReview } = require('../../../utils/response-formatters');

// Helper function to validate business permissions
const validateBusinessPermissions = (req, res) => {
  if (req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// Helper function to get business product IDs
const getBusinessProductIds = async (businessId) => {
  const businessProducts = await Product.find({ owner: businessId }).select('_id');
  return businessProducts.map(p => p._id);
};

// GET /api/v1/business/reviews - Get all reviews that are in that business products only
exports.getReviews = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, rating, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Get business product IDs
    const businessProductIds = await getBusinessProductIds(req.user.id);

    // Build filter object - only reviews for business products
    const filter = {
      product: { $in: businessProductIds }
    };
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(filter)
      .populate('user', 'firstname lastname email role')
      .populate('product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    const formattedReviews = reviews.map(review => formatReview(review));

    res.status(200).json(createResponse('success', {
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get business products reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_reviews')
    });
  }
};

// GET /api/v1/business/reviews/:id - Get review by id
exports.getReviewById = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const review = await Review.findById(req.params.id)
      .populate('user', 'firstname lastname email role')
      .populate('product');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    // Check if the review is for a business product
    const businessProductIds = await getBusinessProductIds(req.user.id);
    // Convert to strings for comparison
    const businessProductIdsStr = businessProductIds.map(id => id.toString());
    const reviewProductIdStr = review.product._id ? review.product._id.toString() : review.product.toString();
    
    if (!businessProductIdsStr.includes(reviewProductIdStr)) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    const formattedReview = formatReview(review);

    res.status(200).json(createResponse('success', { review: formattedReview }, getBilingualMessage('review_retrieved')));
  } catch (err) {
    console.error('Get review by ID error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_review')
    });
  }
};
