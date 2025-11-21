const express = require('express');
const router = express.Router();
const { addReview, getProductReviews, deleteReview, getAllAcceptedReviews } = require('../../../controllers/user/reviews/reviews-controller');
const authenticateToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Apply customer role validation to all routes
router.use(requireCustomer);

// GET /api/v1/user/reviews - Get all accepted reviews for all products
router.get('/', getAllAcceptedReviews);

// POST /api/v1/user/reviews/products/:id/reviews - Add a review to a product
router.post('/products/:id/reviews', addReview);

// GET /api/v1/user/reviews/products/:id/reviews - Get all reviews for a product
router.get('/products/:id/reviews', getProductReviews);

// DELETE /api/v1/user/reviews/products/:id/reviews/:reviewId - Delete a review
router.delete('/products/:id/reviews/:reviewId', deleteReview);

module.exports = router;
