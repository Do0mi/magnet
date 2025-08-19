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

module.exports = router;
