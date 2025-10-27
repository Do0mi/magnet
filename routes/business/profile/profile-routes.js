const express = require('express');
const router = express.Router();
const ProfileController = require('../../../controllers/business/profile/profile-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireBusiness } = require('../../../middleware/role-middleware');

// All business profile routes require authentication
router.use(verifyToken);

// GET /api/v1/business/profile - Get that business user profile
router.get('/', requireBusiness, ProfileController.getProfile);

// PUT /api/v1/business/profile - Update that business user profile
router.put('/', requireBusiness, ProfileController.updateProfile);

module.exports = router;
