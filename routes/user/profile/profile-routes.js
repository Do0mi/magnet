const express = require('express');
const router = express.Router();
const ProfileController = require('../../../controllers/user/profile/profile-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireCustomer } = require('../../../middleware/role-middleware');

// All user profile routes require authentication
router.use(verifyToken);

// GET /api/v1/user/profile - Get customer profile
router.get('/', requireCustomer, ProfileController.getProfile);

// PUT /api/v1/user/profile - Update the current customer profile
router.put('/', requireCustomer, ProfileController.updateProfile);

module.exports = router;
