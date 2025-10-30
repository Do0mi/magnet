const express = require('express');
const router = express.Router();
const ProductController = require('../../../controllers/user/products/products-controller');
const optionalAuth = require('../../../middleware/optional-auth-middleware');

// Public routes with optional authentication: attaches req.user if a valid token is provided
router.use(optionalAuth);

// GET /api/v1/user/products - Get all approved and allowed products
router.get('/', ProductController.getProducts);

// GET /api/v1/user/products/:id - Get product by id
router.get('/:id', ProductController.getProductById);

module.exports = router;
