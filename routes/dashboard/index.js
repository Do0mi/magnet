const express = require('express');
const router = express.Router();
const verifyToken = require('../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../middleware/role-middleware');

// Import all dashboard sub-routes
const usersRoutes = require('./users/users-routes');
const productsRoutes = require('./products/products-routes');
const categoriesRoutes = require('./categories/categories-routes');
const profileRoutes = require('./profile/profile-routes');
const ordersRoutes = require('./orders/orders-routes');
const reviewsRoutes = require('./reviews/reviews-routes');
const addressesRoutes = require('./addresses/addresses-routes');
const wishlistsRoutes = require('./wishlists/wishlists-routes');
const statsRoutes = require('./stats/stats-routes');
const applicantsRoutes = require('./applicants/applicants-routes');
const specialOrdersRoutes = require('./special-orders/special-orders-routes');
const dashboardRoutes = require('./dashboard/dashboard-routes');
const DashboardController = require('../../controllers/dashboard/dashboard/dashboard-controller');

// Mount all dashboard sub-routes
router.use('/dashboard', dashboardRoutes);
// GET /api/v1/dashboard/analytics - Get detailed analytics data
router.get('/analytics', verifyToken, requireAdminOrEmployee, DashboardController.getAnalytics);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/profile', profileRoutes);
router.use('/orders', ordersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/stats', statsRoutes);
router.use('/applicants', applicantsRoutes);
router.use('/special-orders', specialOrdersRoutes);

module.exports = router;
