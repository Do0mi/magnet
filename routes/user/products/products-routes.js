const express = require('express');
const router = express.Router();
const ProductController = require('../../../controllers/user/products/products-controller');
const verifyToken = require('../../../middleware/auth-middleware');

// All user product routes require authentication (protected public endpoints)
router.use(verifyToken);

// GET /api/v1/user/products - Get all approved and allowed products
router.get('/', ProductController.getProducts);

// GET /api/v1/user/products/:id - Get product by id
router.get('/:id', ProductController.getProductById);

module.exports = router;
