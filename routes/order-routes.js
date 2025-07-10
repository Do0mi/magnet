const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireCustomer } = require('../middleware/role-middleware');

// POST /orders (Customer)
router.post('/', verifyToken, requireCustomer, OrderController.createOrder);
// GET /orders/my (Customer views own orders)
router.get('/my', verifyToken, requireCustomer, OrderController.getMyOrders);
// GET /orders/:id (Admin/magnet_employee or owner)
router.get('/:id', verifyToken, OrderController.getOrderById);
// GET /orders (Admin/magnet_employee)
router.get('/', verifyToken, requireAdminOrEmployee, OrderController.getAllOrders);
// PUT /orders/:id/status (Admin/magnet_employee)
router.put('/:id/status', verifyToken, requireAdminOrEmployee, OrderController.updateOrderStatus);

module.exports = router; 