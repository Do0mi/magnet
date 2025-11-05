const express = require('express');
const router = express.Router();
const CategoryController = require('../../controllers/v0/category-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireAdminEmployeeOrBusiness } = require('../middleware/role-middleware');

// GET /categories (public)
router.get('/', CategoryController.getCategories);
// POST /categories (Business, Admin, or magnet_employee)
router.post('/', verifyToken, requireAdminEmployeeOrBusiness, CategoryController.createCategory);
// PUT /categories/:id (Business, Admin, or magnet_employee)
router.put('/:id', verifyToken, requireAdminEmployeeOrBusiness, CategoryController.updateCategory);
// DELETE /categories/:id (Business, Admin, or magnet_employee)
router.delete('/:id', verifyToken, requireAdminEmployeeOrBusiness, CategoryController.deleteCategory);

module.exports = router; 