const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user-controller');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireAdminEmployeeOrBusiness, requireCustomer } = require('../middleware/role-middleware');
const { validateUpdateProfile, validateBusinessApproval } = require('../middleware/validation-middleware');

// Get current user profile
router.get('/profile', verifyToken, requireCustomer, UserController.getProfile);

// Update user profile
router.put('/profile', verifyToken, requireCustomer, validateUpdateProfile, UserController.updateProfile);

// Get all business registration requests (Admin/Magnet Employee only)
router.get('/business-requests', verifyToken, requireAdminOrEmployee, UserController.getBusinessRequests);

// Approve/Reject business registration (Admin/Magnet Employee only)
router.post('/business-approval', verifyToken, requireAdminOrEmployee, validateBusinessApproval, UserController.businessApproval);

// Get business details by ID (Admin/Magnet Employee only)
router.get('/business/:businessId', verifyToken, requireAdminOrEmployee, UserController.getBusinessDetails);

// Get business profile (Business users only)
router.get('/business-profile', verifyToken, requireAdminEmployeeOrBusiness, UserController.getBusinessProfile);


module.exports = router;
