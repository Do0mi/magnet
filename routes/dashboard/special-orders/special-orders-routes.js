const express = require('express');
const router = express.Router();
const SpecialOrderController = require('../../../controllers/dashboard/special-orders/special-orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// Parse JSON bodies for all routes
router.use(express.json());

// All dashboard special order routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/special-orders - Get all special orders
router.get('/', requireAdminOrEmployee, SpecialOrderController.getSpecialOrders);

// GET /api/v1/dashboard/special-orders/:id - Get special order by id
router.get('/:id', requireAdminOrEmployee, SpecialOrderController.getSpecialOrderById);

// POST /api/v1/dashboard/special-orders - Create a special order
router.post('/', requireAdminOrEmployee, SpecialOrderController.createSpecialOrder);

// PUT /api/v1/dashboard/special-orders/:id - Update a special order
router.put('/:id', requireAdminOrEmployee, SpecialOrderController.updateSpecialOrder);

// DELETE /api/v1/dashboard/special-orders/:id - Delete a special order
router.delete('/:id', requireAdminOrEmployee, SpecialOrderController.deleteSpecialOrder);

module.exports = router;

