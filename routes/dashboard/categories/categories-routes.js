const express = require('express');
const router = express.Router();
const CategoryController = require('../../../controllers/dashboard/categories/categories-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard category routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/categories - Get all categories
router.get('/', requireAdminOrEmployee, CategoryController.getCategories);

// GET /api/v1/dashboard/categories/:id - Get category by id
router.get('/:id', requireAdminOrEmployee, CategoryController.getCategoryById);

// POST /api/v1/dashboard/categories/category - Create a category
router.post('/category', requireAdminOrEmployee, CategoryController.createCategory);

// PUT /api/v1/dashboard/categories/category/:id - Update a category
router.put('/category/:id', requireAdminOrEmployee, CategoryController.updateCategory);

// DELETE /api/v1/dashboard/categories/category/:id - Delete a category
router.delete('/category/:id', requireAdminOrEmployee, CategoryController.deleteCategory);

// PUT /api/v1/dashboard/categories/category/:id/toggle - Toggle allow category
router.put('/category/:id/toggle', requireAdminOrEmployee, CategoryController.toggleCategory);

module.exports = router;
