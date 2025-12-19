const express = require('express');
const router = express.Router();
const WishlistController = require('../../../controllers/user/wishlists/wishlists-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomerOrBusiness } = require('../../../middleware/role-middleware');
const detectCountry = require('../../../middleware/detect-country-middleware');

// Detect user country from IP (must be before auth to set req.userCurrency)
router.use(detectCountry);

// All user wishlist routes require authentication
router.use(verifyToken);

// GET /api/v1/user/wishlists - Get that customer's wishlist
router.get('/', requireCustomerOrBusiness, WishlistController.getWishlist);

// PUT /api/v1/user/wishlist - Add product if not exists in the wishlist, remove product if exist
router.put('/', requireCustomerOrBusiness, WishlistController.toggleWishlist);

module.exports = router;
