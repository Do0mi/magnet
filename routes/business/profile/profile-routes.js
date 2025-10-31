const express = require('express');
const router = express.Router();
const ProfileController = require('../../../controllers/business/profile/profile-controller');
const verifyToken = require('../../../middleware/auth-middleware');

// All business profile routes require authentication
router.use(verifyToken);

// GET /api/v1/business/profile - Get that business user profile
// Note: Role validation is done inside the controller, allowing access regardless of approval status
router.get('/', ProfileController.getProfile);

// PUT /api/v1/business/profile - Update that business user profile
// Note: Role validation is done inside the controller, allowing access regardless of approval status
router.put('/', ProfileController.updateProfile);

module.exports = router;
