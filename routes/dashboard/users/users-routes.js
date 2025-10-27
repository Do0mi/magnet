const express = require('express');
const router = express.Router();
const UserController = require('../../../controllers/dashboard/users/users-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// Parse JSON bodies for all routes
router.use(express.json());

// All dashboard user routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/users - Get all users
router.get('/', requireAdminOrEmployee, UserController.getUsers);

// GET /api/v1/dashboard/users/:id - Get user by id
router.get('/:id', requireAdminOrEmployee, UserController.getUserById);

// POST /api/v1/dashboard/users/user - Create user
router.post('/user', requireAdminOrEmployee, UserController.createUser);

// PUT /api/v1/dashboard/users/user/:id - Update user
router.put('/user/:id', requireAdminOrEmployee, UserController.updateUser);

// PUT /api/v1/dashboard/users/user/:id/toggle - Toggle allow user
router.put('/user/:id/toggle', requireAdminOrEmployee, UserController.toggleUser);

// DELETE /api/v1/dashboard/users/user/:id - Delete user
router.delete('/user/:id', requireAdminOrEmployee, UserController.deleteUser);

module.exports = router;
