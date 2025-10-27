const express = require('express');
const router = express.Router();
const OrderController = require('../../../controllers/business/orders/orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireBusiness } = require('../../../middleware/role-middleware');

// All business order routes require authentication
router.use(verifyToken);

// GET /api/v1/business/orders - Get business user orders that contain their own products
router.get('/', requireBusiness, OrderController.getOrders);

// GET /api/v1/business/orders/:id - Get order by id
router.get('/:id', requireBusiness, OrderController.getOrderById);

module.exports = router;
