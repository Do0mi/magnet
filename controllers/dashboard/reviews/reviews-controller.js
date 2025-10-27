// Dashboard Reviews Controller - Admin/Employee Review Management
const Review = require('../../../models/review-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

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
        { 'customer.firstname': { $regex: search, $options: 'i' } },
        { 'customer.lastname': { $regex: search, $options: 'i' } },
        { 'product.name': { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(filter)
      .populate('customer', 'firstname lastname email')
      .populate('product', 'name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      reviews,
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
      .populate('customer', 'firstname lastname email')
      .populate('product', 'name images description');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    res.status(200).json(createResponse('success', { review }));

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

    const { reason } = req.body;

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected', 
        rejectionReason: reason,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    )
      .populate('customer', 'firstname lastname email')
      .populate('product', 'name images');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      review
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
