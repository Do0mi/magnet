const express = require('express');
const router = express.Router();
const WishlistController = require('../../../controllers/user/wishlists/wishlists-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');

// All user wishlist routes require authentication
router.use(verifyToken);

// GET /api/v1/user/wishlists - Get that customer's wishlist
router.get('/', requireCustomer, WishlistController.getWishlist);

// PUT /api/v1/user/wishlist - Add product if not exists in the wishlist, remove product if exist
router.put('/', requireCustomer, WishlistController.toggleWishlist);

module.exports = router;
