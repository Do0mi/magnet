const express = require('express');
const router = express.Router();
const ProductController = require('../../../controllers/business/products/products-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireBusiness } = require('../../../middleware/role-middleware');

// All business product routes require authentication
router.use(verifyToken);

// GET /api/v1/business/products - Get that business user products
router.get('/', requireBusiness, ProductController.getProducts);

// GET /api/v1/business/products/:id - Get product by id
router.get('/:id', requireBusiness, ProductController.getProductById);

// POST /api/v1/business/products/product - The business user creates product
router.post('/product', requireBusiness, ProductController.createProduct);

// PUT /api/v1/business/products/product/:id - The business user updates product
router.put('/product/:id', requireBusiness, ProductController.updateProduct);

// DELETE /api/v1/business/products/product/:id - The business user deletes product
router.delete('/product/:id', requireBusiness, ProductController.deleteProduct);

// PUT /api/v1/business/products/product/:id/toggle - The business user toggles allow/disallow product
router.put('/product/:id/toggle', requireBusiness, ProductController.toggleProduct);

module.exports = router;
