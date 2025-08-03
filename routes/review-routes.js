const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/review-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireCustomer, requireBusiness } = require('../middleware/role-middleware');

// POST /products/:id/reviews (Customer only)
router.post('/products/:id/reviews', verifyToken, requireCustomer, ReviewController.addReview);
// GET /products/:id/reviews (public)
router.get('/products/:id/reviews', ReviewController.getProductReviews);
// GET /business-products-reviews (Business only)
router.get('/business-products-reviews', verifyToken, requireBusiness, ReviewController.getBusinessProductsReviews);
// DELETE /reviews/:id (Admin or magnet_employee)
router.delete('/reviews/:id', verifyToken, requireAdminOrEmployee, ReviewController.deleteReview);

module.exports = router; 