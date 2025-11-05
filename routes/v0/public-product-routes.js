const express = require('express');
const router = express.Router();
const ProductController = require('../../controllers/v0/product-controller');
const optionalAuth = require('../middleware/optional-auth-middleware');

// Public routes for unauthorized users
// These routes don't require authentication but can benefit from it if provided

// GET /public/products - Get all approved products (public access)
router.get('/', optionalAuth, ProductController.getPublicProducts);

// GET /public/products/:id - Get single approved product (public access)
router.get('/:id', optionalAuth, ProductController.getPublicProductById);

// GET /public/products/category/:category - Get products by category (public access)
router.get('/category/:category', optionalAuth, ProductController.getProductsByCategory);

// GET /public/products/search - Search products (public access)
router.get('/search', optionalAuth, ProductController.searchProducts);

module.exports = router;
