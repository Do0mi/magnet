const express = require('express');
const router = express.Router();
const BannerController = require('../../../controllers/user/banners/banners-controller');
const optionalAuth = require('../../../middleware/optional-auth-middleware');
const detectCountry = require('../../../middleware/detect-country-middleware');

// Detect user country from IP (must be before optionalAuth to set req.userCurrency)
router.use(detectCountry);

// Public routes with optional authentication: attaches req.user if a valid token is provided
router.use(optionalAuth);

// GET /api/v1/user/banners - Get all banners without products (only allowed banners)
router.get('/', BannerController.getBanners);

// GET /api/v1/user/banners/:id - Get banner by id with discounted products
router.get('/:id', BannerController.getBannerById);

module.exports = router;
