const express = require('express');
const router = express.Router();
const ReviewController = require('../../../controllers/dashboard/reviews/reviews-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard review routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/reviews - Get all reviews
router.get('/', requireAdminOrEmployee, ReviewController.getReviews);

// GET /api/v1/dashboard/reviews/:id - Get review by id
router.get('/:id', requireAdminOrEmployee, ReviewController.getReviewById);

// PUT /api/v1/dashboard/reviews/review/:id - Reject review
router.put('/review/:id', requireAdminOrEmployee, ReviewController.rejectReview);

// DELETE /api/v1/dashboard/reviews/review/:id - Delete review
router.delete('/review/:id', requireAdminOrEmployee, ReviewController.deleteReview);

module.exports = router;
