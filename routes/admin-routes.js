const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdmin, requireAdminOrEmployee } = require('../middleware/role-middleware');

// All admin routes require authentication
router.use(verifyToken);

// User Management Routes (Admin only)
// POST /admin/users - Create any type of user
router.post('/users', requireAdmin, AdminController.createUser);

// GET /admin/users - Get all users with pagination and filters
router.get('/users', requireAdmin, AdminController.getAllUsers);

// GET /admin/users/stats - Get user statistics
router.get('/users/stats', requireAdmin, AdminController.getUserStats);

// GET /admin/users/:id - Get specific user
router.get('/users/:id', requireAdmin, AdminController.getUserById);

// PUT /admin/users/:id - Update user
router.put('/users/:id', requireAdmin, AdminController.updateUser);

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', requireAdmin, AdminController.deleteUser);

// PUT /admin/users/:id/disallow - Disallow user
router.put('/users/:id/disallow', requireAdmin, AdminController.disallowUser);

// PUT /admin/users/:id/allow - Allow user
router.put('/users/:id/allow', requireAdmin, AdminController.allowUser);

// POST /admin/fix-approved-by - Fix approvedBy field for approved businesses
router.post('/fix-approved-by', requireAdmin, AdminController.fixApprovedByField);

// ========================================
// ADMIN VERIFICATION MANAGEMENT ROUTES (Admin or Magnet Employee)
// ========================================

// PUT /admin/users/:id/verify-email - Verify user email
router.put('/users/:id/verify-email', requireAdminOrEmployee, AdminController.verifyUserEmail);

// PUT /admin/users/:id/unverify-email - Unverify user email
router.put('/users/:id/unverify-email', requireAdminOrEmployee, AdminController.unverifyUserEmail);

// PUT /admin/users/:id/verify-phone - Verify user phone
router.put('/users/:id/verify-phone', requireAdminOrEmployee, AdminController.verifyUserPhone);

// PUT /admin/users/:id/unverify-phone - Unverify user phone
router.put('/users/:id/unverify-phone', requireAdminOrEmployee, AdminController.unverifyUserPhone);

// ========================================
// ADMIN WISHLIST MANAGEMENT ROUTES (Admin only)
// ========================================

// GET /admin/wishlists - Get all wishlists with pagination and filters
router.get('/wishlists', requireAdmin, AdminController.getAllWishlists);

// GET /admin/wishlists/:id - Get specific wishlist
router.get('/wishlists/:id', requireAdmin, AdminController.getWishlistById);

// POST /admin/wishlists - Create wishlist
router.post('/wishlists', requireAdmin, AdminController.createWishlist);

// PUT /admin/wishlists/:id - Update wishlist
router.put('/wishlists/:id', requireAdmin, AdminController.updateWishlist);

// DELETE /admin/wishlists/:id - Delete wishlist
router.delete('/wishlists/:id', requireAdmin, AdminController.deleteWishlist);

// ========================================
// ADMIN REVIEW MANAGEMENT ROUTES (Admin only)
// ========================================

// GET /admin/reviews - Get all reviews with pagination and filters
router.get('/reviews', requireAdmin, AdminController.getAllReviews);

// GET /admin/reviews/:id - Get specific review
router.get('/reviews/:id', requireAdmin, AdminController.getReviewById);

// POST /admin/reviews - Create review
router.post('/reviews', requireAdmin, AdminController.createReview);

// PUT /admin/reviews/:id - Update review
router.put('/reviews/:id', requireAdmin, AdminController.updateReview);

// DELETE /admin/reviews/:id - Delete review
router.delete('/reviews/:id', requireAdmin, AdminController.deleteReview);

// ========================================
// ADMIN ADDRESS MANAGEMENT ROUTES (Admin only)
// ========================================

// GET /admin/addresses - Get all addresses with pagination and filters
router.get('/addresses', requireAdmin, AdminController.getAllAddresses);

// GET /admin/addresses/:id - Get specific address
router.get('/addresses/:id', requireAdmin, AdminController.getAddressById);

// POST /admin/addresses - Create address
router.post('/addresses', requireAdmin, AdminController.createAddress);

// PUT /admin/addresses/:id - Update address
router.put('/addresses/:id', requireAdmin, AdminController.updateAddress);

// DELETE /admin/addresses/:id - Delete address
router.delete('/addresses/:id', requireAdmin, AdminController.deleteAddress);

// ========================================
// ADMIN ORDER MANAGEMENT ROUTES (Admin only)
// ========================================

// GET /admin/orders - Get all orders with pagination and filters
router.get('/orders', requireAdmin, AdminController.getAllOrders);

// GET /admin/orders/:id - Get specific order
router.get('/orders/:id', requireAdmin, AdminController.getOrderById);

// POST /admin/orders - Create order
router.post('/orders', requireAdmin, AdminController.createOrder);

// PUT /admin/orders/:id - Update order
router.put('/orders/:id', requireAdmin, AdminController.updateOrder);

// DELETE /admin/orders/:id - Delete order
router.delete('/orders/:id', requireAdmin, AdminController.deleteOrder);

module.exports = router;
