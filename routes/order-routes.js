const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/order-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireCustomer, requireBusiness } = require('../middleware/role-middleware');

// GET /orders/status-options (Public - anyone can get status options)
router.get('/status-options', OrderController.getStatusOptions);

// GET /orders/business-products (Business - view orders containing their products)
router.get('/business-products', verifyToken, requireBusiness, OrderController.getBusinessProductOrders);

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