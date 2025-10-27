const express = require('express');
const router = express.Router();
const OrderController = require('../../../controllers/dashboard/orders/orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard order routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/orders - Get all orders
router.get('/', requireAdminOrEmployee, OrderController.getOrders);

// GET /api/v1/dashboard/orders/:id - Get order by id
router.get('/:id', requireAdminOrEmployee, OrderController.getOrderById);

// POST /api/v1/dashboard/orders/order - Create an order that contains products to a specific user
router.post('/order', requireAdminOrEmployee, OrderController.createOrder);

// PUT /api/v1/dashboard/orders/order/:id - Update an order that contains products to a specific user
router.put('/order/:id', requireAdminOrEmployee, OrderController.updateOrder);

// DELETE /api/v1/dashboard/orders/order/:id - Delete an order that contains products to a specific user
router.delete('/order/:id', requireAdminOrEmployee, OrderController.deleteOrder);

module.exports = router;
