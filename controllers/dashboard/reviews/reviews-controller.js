// Dashboard Reviews Controller - Admin/Employee Review Management
const Review = require('../../../models/review-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatReview } = require('../../../utils/response-formatters');
const { sendReviewRejectionNotification } = require('../../../utils/email-utils');

// Base currency for dashboard (always USD)
const BASE_CURRENCY = 'USD';

// Helper function to validate admin or magnet employee permissions
const validateAdminOrEmployeePermissions = (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/dashboard/reviews - Get all reviews
exports.getReviews = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, rating, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (rating) filter.rating = parseInt(rating);
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { comment: { $regex: search, $options: 'i' } },
        { 'user.firstname': { $regex: search, $options: 'i' } },
        { 'user.lastname': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(filter)
      .populate('user', 'firstname lastname email role')
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

    const total = await Review.countDocuments(filter);
    const formattedReviews = reviews.map(review => formatReview(review));

    res.status(200).json(createResponse('success', {
      reviews: formattedReviews,
      currency: BASE_CURRENCY,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_reviews')
    });
  }
};

// GET /api/v1/dashboard/reviews/:id - Get review by id
exports.getReviewById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const review = await Review.findById(req.params.id)
      .populate('user', 'firstname lastname email role')
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

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    const formattedReview = formatReview(review);
    res.status(200).json(createResponse('success', { 
      review: formattedReview,
      currency: BASE_CURRENCY
    }));

  } catch (error) {
    console.error('Get review by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_review')
    });
  }
};

// PUT /api/v1/dashboard/reviews/review/:id - Reject review
exports.rejectReview = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { reason } = req.body || {};

    // Debug logging
    console.log('Request body:', req.body);
    console.log('Reason:', reason);

    // Validate that reason is provided
    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('rejection_reason_required')
      });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'reject', 
        rejectionReason: reason,
        rejectedBy: req.user.id,
        rejectedAt: Date.now(),
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    )
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

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    const formattedReview = formatReview(review);
    
    // Send email notification to the user who made the review
    try {
      const userName = `${review.user.firstname} ${review.user.lastname}`;
      const productName = review.product.name?.en || review.product.name?.ar || 'Product';
      
      await sendReviewRejectionNotification(
        review.user.email,
        userName,
        productName,
        reason
      );
      console.log('Review rejection email sent successfully');
    } catch (emailError) {
      console.error('Failed to send review rejection email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json(createResponse('success', {
      review: formattedReview,
      currency: BASE_CURRENCY
    }, getBilingualMessage('review_rejected_success')));

  } catch (error) {
    console.error('Reject review error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_reject_review')
    });
  }
};

// DELETE /api/v1/dashboard/reviews/review/:id - Delete review
exports.deleteReview = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const review = await Review.findByIdAndDelete(req.params.id);

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('review_deleted_success')));

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_review')
    });
  }
};
