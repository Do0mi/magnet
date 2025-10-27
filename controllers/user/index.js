// User Controllers Index
const authController = require('./auth/auth-controller');
const profileController = require('./profile/profile-controller');
const productsController = require('./products/products-controller');
const ordersController = require('./orders/orders-controller');
const addressesController = require('./addresses/addresses-controller');
const wishlistsController = require('./wishlists/wishlists-controller');

module.exports = {
  authController,
  profileController,
  productsController,
  ordersController,
  addressesController,
  wishlistsController
};
