const express = require('express');
const router = express.Router();
const AdminController = require('../../controllers/admin-controller');
const verifyToken = require('../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../middleware/role-middleware');

// All dashboard stats routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/stats/users - Get user statistics (Admin/Employee)
router.get('/users', requireAdminOrEmployee, AdminController.getUserStats);

// GET /api/v1/dashboard/stats/orders - Get order statistics (Admin/Employee)
router.get('/orders', requireAdminOrEmployee, (req, res) => {
  // This would be implemented in AdminController
  res.status(200).json({ message: 'Order statistics endpoint - to be implemented' });
});

// GET /api/v1/dashboard/stats/products - Get product statistics (Admin/Employee)
router.get('/products', requireAdminOrEmployee, (req, res) => {
  // This would be implemented in AdminController
  res.status(200).json({ message: 'Product statistics endpoint - to be implemented' });
});

// GET /api/v1/dashboard/stats/reviews - Get review statistics (Admin/Employee)
router.get('/reviews', requireAdminOrEmployee, (req, res) => {
  // This would be implemented in AdminController
  res.status(200).json({ message: 'Review statistics endpoint - to be implemented' });
});

// GET /api/v1/dashboard/stats/general - Get general statistics (Admin/Employee)
router.get('/general', requireAdminOrEmployee, (req, res) => {
  // This would be implemented in AdminController
  res.status(200).json({ message: 'General statistics endpoint - to be implemented' });
});

module.exports = router;
