const express = require('express');
const router = express.Router();

// Import all user sub-routes
const authRoutes = require('./auth/auth-routes');
const profileRoutes = require('./profile/profile-routes');
const productsRoutes = require('./products/products-routes');
const ordersRoutes = require('./orders/orders-routes');
const addressesRoutes = require('./addresses/addresses-routes');
const wishlistsRoutes = require('./wishlists/wishlists-routes');
const reviewsRoutes = require('./reviews/reviews-routes');

// Mount all user sub-routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/reviews', reviewsRoutes);

module.exports = router;
