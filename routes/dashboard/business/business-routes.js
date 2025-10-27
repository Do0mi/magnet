const express = require('express');
const router = express.Router();
const BusinessController = require('../../../controllers/dashboard/business/business-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard business routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/business/businesses - Get all business requests
router.get('/businesses', requireAdminOrEmployee, BusinessController.getBusinesses);

// GET /api/v1/dashboard/business/businesses/:id - Get business request by id
router.get('/businesses/:id', requireAdminOrEmployee, BusinessController.getBusinessById);

// PUT /api/v1/dashboard/business/approve - Approve a business request
router.put('/approve', requireAdminOrEmployee, BusinessController.approveBusiness);

// PUT /api/v1/dashboard/business/decline - Decline a business request
router.put('/decline', requireAdminOrEmployee, BusinessController.declineBusiness);

module.exports = router;
