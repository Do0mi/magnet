const express = require('express');
const router = express.Router();
const ProfileController = require('../../../controllers/user/profile/profile-controller');
const verifyToken = require('../../../middleware/auth-middleware');

// All user profile routes require authentication
router.use(verifyToken);

// GET /api/v1/user/profile - Get customer profile
// Note: Role validation is done inside the controller, allowing access regardless of user status
router.get('/', ProfileController.getProfile);

// PUT /api/v1/user/profile - Update the current customer profile
// Note: Role validation is done inside the controller, allowing access regardless of user status
router.put('/', ProfileController.updateProfile);

module.exports = router;
