const express = require('express');
const router = express.Router();
const BannerController = require('../../../controllers/business/banners/banners-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireBusiness } = require('../../../middleware/role-middleware');

// All business banner routes require authentication
router.use(verifyToken);

// POST /api/v1/business/banners - Create banner
router.post('/', requireBusiness, BannerController.createBanner);

// GET /api/v1/business/banners - Get all banners without products (only own banners)
router.get('/', requireBusiness, BannerController.getBanners);

// GET /api/v1/business/banners/:id - Get banner by id with discounted products
router.get('/:id', requireBusiness, BannerController.getBannerById);

// PUT /api/v1/business/banners/:id - Update banner
router.put('/:id', requireBusiness, BannerController.updateBanner);

// DELETE /api/v1/business/banners/:id - Delete banner
router.delete('/:id', requireBusiness, BannerController.deleteBanner);

// PUT /api/v1/business/banners/:id/toggle - Toggle allow banner
router.put('/:id/toggle', requireBusiness, BannerController.toggleBanner);

module.exports = router;
