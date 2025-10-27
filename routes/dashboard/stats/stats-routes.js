const express = require('express');
const router = express.Router();
const StatsController = require('../../../controllers/dashboard/stats/stats-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard stats routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/stats/users - Get user statistics (Admin/Employee)
router.get('/users', requireAdminOrEmployee, StatsController.getUserStats);

// GET /api/v1/dashboard/stats/orders - Get order statistics (Admin/Employee)
router.get('/orders', requireAdminOrEmployee, StatsController.getOrderStats);

// GET /api/v1/dashboard/stats/products - Get product statistics (Admin/Employee)
router.get('/products', requireAdminOrEmployee, StatsController.getProductStats);

// GET /api/v1/dashboard/stats/reviews - Get review statistics (Admin/Employee)
router.get('/reviews', requireAdminOrEmployee, StatsController.getReviewStats);

// GET /api/v1/dashboard/stats/general - Get general statistics (Admin/Employee)
router.get('/general', requireAdminOrEmployee, StatsController.getGeneralStats);

module.exports = router;
