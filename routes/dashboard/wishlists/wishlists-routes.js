const express = require('express');
const router = express.Router();
const WishlistController = require('../../../controllers/dashboard/wishlists/wishlists-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard wishlist routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/wishlists - Get all wishlists
router.get('/', requireAdminOrEmployee, WishlistController.getWishlists);

// GET /api/v1/dashboard/wishlists/:id - Get wishlist by id
router.get('/:id', requireAdminOrEmployee, WishlistController.getWishlistById);

// POST /api/v1/dashboard/wishlists/wishlist - Create wishlist
router.post('/wishlist', requireAdminOrEmployee, WishlistController.createWishlist);

// PUT /api/v1/dashboard/wishlists/wishlist/:id - Update wishlist
router.put('/wishlist/:id', requireAdminOrEmployee, WishlistController.updateWishlist);

// DELETE /api/v1/dashboard/wishlists/wishlist/:id - Delete wishlist
router.delete('/wishlist/:id', requireAdminOrEmployee, WishlistController.deleteWishlist);

module.exports = router;
