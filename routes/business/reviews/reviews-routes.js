const express = require('express');
const router = express.Router();
const ReviewController = require('../../../controllers/business/reviews/reviews-controller');
const verifyToken = require('../../../middleware/auth-middleware');

// All business review routes require authentication
router.use(verifyToken);

// GET /api/v1/business/reviews - Get all reviews that are in that business products only
// Note: Role validation is done inside the controller, allowing access regardless of approval status
router.get('/', ReviewController.getReviews);

// GET /api/v1/business/reviews/:id - Get review by id
// Note: Role validation is done inside the controller, allowing access regardless of approval status
router.get('/:id', ReviewController.getReviewById);

module.exports = router;
