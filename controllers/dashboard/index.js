// Dashboard Controllers Index
const usersController = require('./users/users-controller');
const productsController = require('./products/products-controller');
const categoriesController = require('./categories/categories-controller');
const profileController = require('./profile/profile-controller');
const ordersController = require('./orders/orders-controller');
const reviewsController = require('./reviews/reviews-controller');
const addressesController = require('./addresses/addresses-controller');
const wishlistsController = require('./wishlists/wishlists-controller');
const statsController = require('./stats/stats-controller');
const applicantsController = require('./applicants/applicants-controller');
const specialOrdersController = require('./special-orders/special-orders-controller');

module.exports = {
  usersController,
  productsController,
  categoriesController,
  profileController,
  ordersController,
  reviewsController,
  addressesController,
  wishlistsController,
  statsController,
  applicantsController,
  specialOrdersController
};
