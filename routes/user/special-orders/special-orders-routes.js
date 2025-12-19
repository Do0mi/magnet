const express = require('express');
const router = express.Router();
const SpecialOrderController = require('../../../controllers/user/special-orders/special-orders-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomerOrBusiness } = require('../../../middleware/role-middleware');
const detectCountry = require('../../../middleware/detect-country-middleware');

// Parse JSON bodies for all routes
router.use(express.json());

// Detect user country from IP (must be before auth to set req.userCurrency)
router.use(detectCountry);

// All user special order routes require authentication
router.use(verifyToken);

// GET /api/v1/user/special-orders - Get all special orders for the authenticated user
router.get('/', requireCustomerOrBusiness, SpecialOrderController.getAllSpecialOrders);

// GET /api/v1/user/special-orders/:id - Get a specific special order by id
router.get('/:id', requireCustomerOrBusiness, SpecialOrderController.getSpecialOrderById);

// POST /api/v1/user/special-orders - Create a special order
router.post('/', requireCustomerOrBusiness, SpecialOrderController.createSpecialOrder);

// PUT /api/v1/user/special-orders/:id/cancel - Cancel a special order
router.put('/:id/cancel', requireCustomerOrBusiness, SpecialOrderController.cancelSpecialOrder);

module.exports = router;

