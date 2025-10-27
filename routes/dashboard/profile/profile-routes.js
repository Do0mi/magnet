const express = require('express');
const router = express.Router();
const ProfileController = require('../../../controllers/dashboard/profile/profile-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { requireAdminOrEmployee } = require('../../../middleware/role-middleware');

// All dashboard profile routes require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/profile - Get the current admin/magnet_employee user profile
router.get('/', requireAdminOrEmployee, ProfileController.getProfile);

// PUT /api/v1/dashboard/profile - Update the current admin/magnet_employee user profile
router.put('/', requireAdminOrEmployee, ProfileController.updateProfile);

module.exports = router;
