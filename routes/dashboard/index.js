const express = require('express');
const router = express.Router();

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

// Mount all dashboard sub-routes
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/profile', profileRoutes);
router.use('/orders', ordersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/stats', statsRoutes);

module.exports = router;
