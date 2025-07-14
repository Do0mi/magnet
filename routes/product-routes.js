const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/product-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireBusiness, requireAdminEmployeeOrBusiness } = require('../middleware/role-middleware');

// GET /products (public)
router.get('/', verifyToken, ProductController.getProducts);
// POST /addProductsByBusiness (business only)
router.post('/addProductsByBusiness', verifyToken, requireBusiness, ProductController.addProductsByBusiness);
// POST /addProductsByMagnet_employee (magnet_employee only)
router.post('/addProductsByMagnet_employee', verifyToken, requireAdminOrEmployee, ProductController.addProductsByMagnetEmployee);
// PUT /products/:id (business: own, admin, or magnet_employee)
router.put('/:id', verifyToken, requireAdminEmployeeOrBusiness, ProductController.updateProduct);
// DELETE /products/:id (business: own, admin, or magnet_employee)
router.delete('/:id', verifyToken, requireAdminEmployeeOrBusiness, ProductController.deleteProduct);
// PUT /products/:id/approve (admin/magnet_employee only)
router.put('/:id/approve', verifyToken, requireAdminOrEmployee, ProductController.approveProduct);
// PUT /products/:id/decline (admin/magnet_employee only)
router.put('/:id/decline', verifyToken, requireAdminOrEmployee, ProductController.declineProduct);

module.exports = router; 