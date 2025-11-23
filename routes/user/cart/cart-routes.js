const express = require('express');
const router = express.Router();
const CartController = require('../../../controllers/user/cart/cart-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');
const detectCountry = require('../../../middleware/detect-country-middleware');

// Detect user country from IP (must be before auth to set req.userCurrency)
router.use(detectCountry);

// All user cart routes require authentication
router.use(verifyToken);

// GET /api/v1/user/cart - Get the authenticated customer's cart
router.get('/', requireCustomer, CartController.getCart);

// PUT /api/v1/user/cart - Replace the authenticated customer's cart items
router.put('/', requireCustomer, CartController.updateCart);

module.exports = router;

