const express = require('express');
const router = express.Router();
const WishlistController = require('../../controllers/v0/wishlist-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireCustomer } = require('../middleware/role-middleware');

// GET /wishlist (Customer only)
router.get('/', verifyToken, requireCustomer, WishlistController.getWishlist);
// POST /wishlist (Customer only)
router.post('/', verifyToken, requireCustomer, WishlistController.addToWishlist);
// DELETE /wishlist/:productId (Customer only)
router.delete('/:productId', verifyToken, requireCustomer, WishlistController.removeFromWishlist);

module.exports = router; 