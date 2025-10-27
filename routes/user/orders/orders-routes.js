const express = require('express');
const router = express.Router();
const OrderController = require('../../../controllers/user/orders/orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');

// All user order routes require authentication
router.use(verifyToken);

// GET /api/v1/user/orders - Get all customer's orders
router.get('/', requireCustomer, OrderController.getOrders);

// GET /api/v1/user/orders/:id - Get a specific customer's order
router.get('/:id', requireCustomer, OrderController.getOrderById);

// POST /api/v1/user/orders/order - Create an order
router.post('/order', requireCustomer, OrderController.createOrder);

// PUT /api/v1/user/orders/order/:id - Update an existing order
router.put('/order/:id', requireCustomer, OrderController.updateOrder);

// PUT /api/v1/user/orders/order/:id/cancel - Cancel an order
router.put('/order/:id/cancel', requireCustomer, OrderController.cancelOrder);

module.exports = router;
