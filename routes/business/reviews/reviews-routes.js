const express = require('express');
const router = express.Router();
const ReviewController = require('../../../controllers/business/reviews/reviews-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireBusiness } = require('../../../middleware/role-middleware');

// All business review routes require authentication
router.use(verifyToken);

// GET /api/v1/business/reviews - Get all reviews that are in that business products only
router.get('/', requireBusiness, ReviewController.getReviews);

// GET /api/v1/business/reviews/:id - Get review by id
router.get('/:id', requireBusiness, ReviewController.getReviewById);

module.exports = router;
