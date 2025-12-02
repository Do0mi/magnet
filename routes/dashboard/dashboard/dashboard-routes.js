const express = require('express');
const router = express.Router();
const DashboardController = require('../../../controllers/dashboard/dashboard/dashboard-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/dashboard - Get comprehensive dashboard overview
router.get('/', requireAdminOrEmployee, DashboardController.getDashboard);

module.exports = router;

