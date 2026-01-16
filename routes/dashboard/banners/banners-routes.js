const express = require('express');
const router = express.Router();
const BannerController = require('../../../controllers/dashboard/banners/banners-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard banner routes require authentication
router.use(verifyToken);

// POST /api/v1/dashboard/banners - Create banner
router.post('/', requireAdminOrEmployee, BannerController.createBanner);

// GET /api/v1/dashboard/banners - Get all banners with products
router.get('/', requireAdminOrEmployee, BannerController.getBanners);

// GET /api/v1/dashboard/banners/:id - Get banner by id with discounted products
router.get('/:id', requireAdminOrEmployee, BannerController.getBannerById);

// PUT /api/v1/dashboard/banners/:id - Update banner
router.put('/:id', requireAdminOrEmployee, BannerController.updateBanner);

// DELETE /api/v1/dashboard/banners/:id - Delete banner
router.delete('/:id', requireAdminOrEmployee, BannerController.deleteBanner);

// PUT /api/v1/dashboard/banners/:id/toggle - Toggle allow banner
router.put('/:id/toggle', requireAdminOrEmployee, BannerController.toggleBanner);

module.exports = router;
