// User Reviews Controller - Customer Review Management
const Review = require('../../../models/review-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatReview } = require('../../../utils/response-formatters');
const { sendNewReviewNotification } = require('../../../utils/email-utils');

// Helper function to update product rating
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ product: productId });
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0 });
      return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    await Product.findByIdAndUpdate(productId, { rating: averageRating });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
};

// POST /api/v1/user/products/:id/reviews - Add a review to a product
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_rating')
      });
    }

    // Check if product exists and is approved
    const product = await Product.findById(productId)
      .populate('owner', 'firstname lastname email businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');
    
    if (!product || product.status !== 'approved') {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('product_not_found_or_not_approved') 
      });
    }

    // Prevent duplicate reviews by same user
    const existing = await Review.findOne({ product: productId, user: req.user.id });
    if (existing) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('already_reviewed_product') 
      });
    }
    
    const review = new Review({
      product: productId,
      user: req.user.id,
      rating,
      comment
    });
    
    await review.save();
    await updateProductRating(productId);
    
    // Re-populate to get the complete review with populated fields
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'firstname lastname email role')
      .populate('rejectedBy', 'firstname lastname email role')
      .populate({
        path: 'product',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'product',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      });
    
    const formattedReview = formatReview(populatedReview);
    
    // Send email notification to the business user who owns the product
    try {
      const businessName = product.owner.businessInfo?.companyName || `${product.owner.firstname} ${product.owner.lastname}`;
      const productName = product.name?.en || product.name?.ar || 'Product';
      const customerName = `${populatedReview.user.firstname} ${populatedReview.user.lastname}`;
      
      await sendNewReviewNotification(
        product.owner.email,
        businessName,
        productName,
        customerName,
        rating,
        comment
      );
      console.log('New review notification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send new review notification email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(201).json(createResponse('success', 
      { review: formattedReview },
      getBilingualMessage('review_added')
    ));
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_add_review') 
    });
  }
};

// GET /api/v1/user/products/:id/reviews - Get all reviews for a product
exports.getProductReviews = async (req, res) => {
  try {
    const productId = req.params.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    const reviews = await Review.find({ product: productId })
      .populate('user', 'firstname lastname email role')
      .populate('rejectedBy', 'firstname lastname email role')
      .populate({
        path: 'product',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'product',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments({ product: productId });
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
  } catch (err) {
    console.error('Get product reviews error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_reviews') 
    });
  }
};

// DELETE /api/v1/user/products/:id/reviews/:reviewId - Delete a review
exports.deleteReview = async (req, res) => {
  try {
    const { id: productId, reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('review_not_found') 
      });
    }

    // Check if review belongs to the specified product
    if (review.product.toString() !== productId) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    // Check if user owns this review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('not_authorized_delete_review')
      });
    }

    await review.deleteOne();
    await updateProductRating(productId);
    
    res.status(200).json(createResponse('success', null, getBilingualMessage('review_deleted')));
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_delete_review') 
    });
  }
};
