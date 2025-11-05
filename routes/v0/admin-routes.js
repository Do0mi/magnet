const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/v0/admin-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdmin, requireAdminOrEmployee } = require('../middleware/role-middleware');

// All admin routes require authentication
router.use(verifyToken);

// User Management Routes (Admin or Magnet Employee)
// POST /admin/users - Create any type of user
router.post('/users', requireAdminOrEmployee, AdminController.createUser);

// GET /admin/users - Get all users with pagination and filters
router.get('/users', requireAdminOrEmployee, AdminController.getAllUsers);

// GET /admin/users/stats - Get user statistics
router.get('/users/stats', requireAdminOrEmployee, AdminController.getUserStats);

// GET /admin/users/:id - Get specific user
router.get('/users/:id', requireAdminOrEmployee, AdminController.getUserById);

// PUT /admin/users/:id - Update user
router.put('/users/:id', requireAdminOrEmployee, AdminController.updateUser);

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', requireAdminOrEmployee, AdminController.deleteUser);

// PUT /admin/users/:id/disallow - Disallow user
router.put('/users/:id/disallow', requireAdminOrEmployee, AdminController.disallowUser);

// PUT /admin/users/:id/allow - Allow user
router.put('/users/:id/allow', requireAdminOrEmployee, AdminController.allowUser);

// ========================================
// ADMIN WISHLIST MANAGEMENT ROUTES (Admin or Magnet Employee)
// ========================================

// GET /admin/wishlists - Get all wishlists with pagination and filters
router.get('/wishlists', requireAdminOrEmployee, AdminController.getAllWishlists);

// GET /admin/wishlists/:id - Get specific wishlist
router.get('/wishlists/:id', requireAdminOrEmployee, AdminController.getWishlistById);

// POST /admin/wishlists - Create wishlist
router.post('/wishlists', requireAdminOrEmployee, AdminController.createWishlist);

// PUT /admin/wishlists/:id - Update wishlist
router.put('/wishlists/:id', requireAdminOrEmployee, AdminController.updateWishlist);

// DELETE /admin/wishlists/:id - Delete wishlist
router.delete('/wishlists/:id', requireAdminOrEmployee, AdminController.deleteWishlist);

// ========================================
// ADMIN REVIEW MANAGEMENT ROUTES (Admin or Magnet Employee)
// ========================================

// GET /admin/reviews - Get all reviews with pagination and filters
router.get('/reviews', requireAdminOrEmployee, AdminController.getAllReviews);

// GET /admin/reviews/:id - Get specific review
router.get('/reviews/:id', requireAdminOrEmployee, AdminController.getReviewById);

// POST /admin/reviews - Create review
router.post('/reviews', requireAdminOrEmployee, AdminController.createReview);

// PUT /admin/reviews/:id - Update review
router.put('/reviews/:id', requireAdminOrEmployee, AdminController.updateReview);

// DELETE /admin/reviews/:id - Delete review
router.delete('/reviews/:id', requireAdminOrEmployee, AdminController.deleteReview);

// PUT /admin/reviews/:id/reject - Reject review
router.put('/reviews/:id/reject', requireAdminOrEmployee, AdminController.rejectReview);



// ========================================
// ADMIN ADDRESS MANAGEMENT ROUTES (Admin or Magnet Employee)
// ========================================

// GET /admin/addresses - Get all addresses with pagination and filters
router.get('/addresses', requireAdminOrEmployee, AdminController.getAllAddresses);

// GET /admin/addresses/:id - Get specific address
router.get('/addresses/:id', requireAdminOrEmployee, AdminController.getAddressById);

// POST /admin/addresses - Create address
router.post('/addresses', requireAdminOrEmployee, AdminController.createAddress);

// PUT /admin/addresses/:id - Update address
router.put('/addresses/:id', requireAdminOrEmployee, AdminController.updateAddress);

// DELETE /admin/addresses/:id - Delete address
router.delete('/addresses/:id', requireAdminOrEmployee, AdminController.deleteAddress);

// ========================================
// ADMIN ORDER MANAGEMENT ROUTES (Admin or Magnet Employee)
// ========================================

// GET /admin/orders - Get all orders with pagination and filters
router.get('/orders', requireAdminOrEmployee, AdminController.getAllOrders);

// GET /admin/orders/:id - Get specific order
router.get('/orders/:id', requireAdminOrEmployee, AdminController.getOrderById);

// POST /admin/orders - Create order
router.post('/orders', requireAdminOrEmployee, AdminController.createOrder);

// PUT /admin/orders/:id - Update order
router.put('/orders/:id', requireAdminOrEmployee, AdminController.updateOrder);

// DELETE /admin/orders/:id - Delete order
router.delete('/orders/:id', requireAdminOrEmployee, AdminController.deleteOrder);

module.exports = router;
