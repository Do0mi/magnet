const express = require('express');
const router = express.Router();
const ProductController = require('../../../controllers/dashboard/products/products-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard product routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/products - Get all products
router.get('/', requireAdminOrEmployee, ProductController.getProducts);

// GET /api/v1/dashboard/products/:id - Get product by id
router.get('/:id', requireAdminOrEmployee, ProductController.getProductById);

// POST /api/v1/dashboard/products/product - Create product to a specific business user
router.post('/product', requireAdminOrEmployee, ProductController.createProduct);

// PUT /api/v1/dashboard/products/product/:id - Update product to a specific business user
router.put('/product/:id', requireAdminOrEmployee, ProductController.updateProduct);

// DELETE /api/v1/dashboard/products/product/:id - Delete product to a specific business user
router.delete('/product/:id', requireAdminOrEmployee, ProductController.deleteProduct);

// PUT /api/v1/dashboard/products/product/:id/approve - Approve product to a specific business user
router.put('/product/:id/approve', requireAdminOrEmployee, ProductController.approveProduct);

// PUT /api/v1/dashboard/products/product/:id/decline - Decline product to a specific business user
router.put('/product/:id/decline', requireAdminOrEmployee, ProductController.declineProduct);

// PUT /api/v1/dashboard/products/product/:id/toggle - Toggle allow product to a specific business user
router.put('/product/:id/toggle', requireAdminOrEmployee, ProductController.toggleProduct);

// GET /api/v1/dashboard/products/:id/reviews - Get a specific product reviews
router.get('/:id/reviews', requireAdminOrEmployee, ProductController.getProductReviews);

// GET /api/v1/dashboard/products/:id/orders - Get a specific product orders
router.get('/:id/orders', requireAdminOrEmployee, ProductController.getProductOrders);

// GET /api/v1/dashboard/products/:productId/reviews/:reviewId - Get a specific product review by id
router.get('/:productId/reviews/:reviewId', requireAdminOrEmployee, ProductController.getProductReviewById);

// GET /api/v1/dashboard/products/:productId/orders/:orderId - Get a specific product order by id
router.get('/:productId/orders/:orderId', requireAdminOrEmployee, ProductController.getProductOrderById);

module.exports = router;
