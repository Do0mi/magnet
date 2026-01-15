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
const cartRoutes = require('./cart/cart-routes');
const categoriesRoutes = require('./categories/categories-routes');
const applicantsRoutes = require('./applicants/applicants-routes');
const specialOrdersRoutes = require('./special-orders/special-orders-routes');
const notificationsRoutes = require('./notifications/notifications-routes');
const bannersRoutes = require('./banners/banners-routes');

// Mount all user sub-routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/products', productsRoutes);
router.use('/orders', ordersRoutes);
router.use('/addresses', addressesRoutes);
router.use('/wishlists', wishlistsRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/cart', cartRoutes);
router.use('/categories', categoriesRoutes);
router.use('/applicants', applicantsRoutes);
router.use('/special-orders', specialOrdersRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/banners', bannersRoutes);

module.exports = router;
