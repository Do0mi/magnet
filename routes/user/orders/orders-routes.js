const express = require('express');
const router = express.Router();
const OrderController = require('../../../controllers/user/orders/orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomerOrBusiness } = require('../../../middleware/role-middleware');
const detectCountry = require('../../../middleware/detect-country-middleware');

// Detect user country from IP (must be before auth to set req.userCurrency)
router.use(detectCountry);

// All user order routes require authentication
router.use(verifyToken);

// GET /api/v1/user/orders - Get all customer's orders
router.get('/', requireCustomerOrBusiness, OrderController.getOrders);

// GET /api/v1/user/orders/:id - Get a specific customer's order
router.get('/:id', requireCustomerOrBusiness, OrderController.getOrderById);

// POST /api/v1/user/orders/order - Create an order
router.post('/order', requireCustomerOrBusiness, OrderController.createOrder);

// PUT /api/v1/user/orders/order/:id - Update an existing order
router.put('/order/:id', requireCustomerOrBusiness, OrderController.updateOrder);

// PUT /api/v1/user/orders/order/:id/cancel - Cancel an order
router.put('/order/:id/cancel', requireCustomerOrBusiness, OrderController.cancelOrder);

module.exports = router;
