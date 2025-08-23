const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdmin } = require('../middleware/role-middleware');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

// User Management Routes
// POST /admin/users - Create any type of user
router.post('/users', AdminController.createUser);

// GET /admin/users - Get all users with pagination and filters
router.get('/users', AdminController.getAllUsers);

// GET /admin/users/stats - Get user statistics
router.get('/users/stats', AdminController.getUserStats);

// GET /admin/users/:id - Get specific user
router.get('/users/:id', AdminController.getUserById);

// PUT /admin/users/:id - Update user
router.put('/users/:id', AdminController.updateUser);

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', AdminController.deleteUser);

// PUT /admin/users/:id/disallow - Disallow user
router.put('/users/:id/disallow', AdminController.disallowUser);

// PUT /admin/users/:id/allow - Allow user
router.put('/users/:id/allow', AdminController.allowUser);

// ========================================
// ADMIN WISHLIST MANAGEMENT ROUTES
// ========================================

// GET /admin/wishlists - Get all wishlists with pagination and filters
router.get('/wishlists', AdminController.getAllWishlists);

// GET /admin/wishlists/:id - Get specific wishlist
router.get('/wishlists/:id', AdminController.getWishlistById);

// POST /admin/wishlists - Create wishlist
router.post('/wishlists', AdminController.createWishlist);

// PUT /admin/wishlists/:id - Update wishlist
router.put('/wishlists/:id', AdminController.updateWishlist);

// DELETE /admin/wishlists/:id - Delete wishlist
router.delete('/wishlists/:id', AdminController.deleteWishlist);

// ========================================
// ADMIN REVIEW MANAGEMENT ROUTES
// ========================================

// GET /admin/reviews - Get all reviews with pagination and filters
router.get('/reviews', AdminController.getAllReviews);

// GET /admin/reviews/:id - Get specific review
router.get('/reviews/:id', AdminController.getReviewById);

// POST /admin/reviews - Create review
router.post('/reviews', AdminController.createReview);

// PUT /admin/reviews/:id - Update review
router.put('/reviews/:id', AdminController.updateReview);

// DELETE /admin/reviews/:id - Delete review
router.delete('/reviews/:id', AdminController.deleteReview);

// ========================================
// ADMIN ADDRESS MANAGEMENT ROUTES
// ========================================

// GET /admin/addresses - Get all addresses with pagination and filters
router.get('/addresses', AdminController.getAllAddresses);

// GET /admin/addresses/:id - Get specific address
router.get('/addresses/:id', AdminController.getAddressById);

// POST /admin/addresses - Create address
router.post('/addresses', AdminController.createAddress);

// PUT /admin/addresses/:id - Update address
router.put('/addresses/:id', AdminController.updateAddress);

// DELETE /admin/addresses/:id - Delete address
router.delete('/addresses/:id', AdminController.deleteAddress);

// ========================================
// ADMIN ORDER MANAGEMENT ROUTES
// ========================================

// GET /admin/orders - Get all orders with pagination and filters
router.get('/orders', AdminController.getAllOrders);

// GET /admin/orders/:id - Get specific order
router.get('/orders/:id', AdminController.getOrderById);

// POST /admin/orders - Create order
router.post('/orders', AdminController.createOrder);

// PUT /admin/orders/:id - Update order
router.put('/orders/:id', AdminController.updateOrder);

// DELETE /admin/orders/:id - Delete order
router.delete('/orders/:id', AdminController.deleteOrder);

module.exports = router;
