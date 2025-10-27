const express = require('express');
const router = express.Router();

// Import all business sub-routes
const productsRoutes = require('./products/products-routes');
const ordersRoutes = require('./orders/orders-routes');
const reviewsRoutes = require('./reviews/reviews-routes');
const profileRoutes = require('./profile/profile-routes');

// Mount all business sub-routes
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/profile', profileRoutes);

module.exports = router;
