// Business Controllers Index
const productsController = require('./products/products-controller');
const ordersController = require('./orders/orders-controller');
const reviewsController = require('./reviews/reviews-controller');
const profileController = require('./profile/profile-controller');

module.exports = {
  productsController,
  ordersController,
  reviewsController,
  profileController
};
