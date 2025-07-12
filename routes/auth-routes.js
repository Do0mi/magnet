const express = require('express');
const passport = require('passport');
const router = express.Router();
const AuthController = require('../controllers/auth-controller');
const verifyToken = require('../middleware/auth-middleware');
const { 
  validateRegister, 
  validateBusinessRegister, 
  validateSendEmailOTP, 
  validateSendPhoneOTP, 
  validateConfirmOTP, 
  validateLogin, 
  validateLoginWithOTP, 
  validateForgotPassword 
} = require('../middleware/validation-middleware');

// Register API
router.post('/register', validateRegister, AuthController.register);

// Business Register API
router.post('/business-register', validateBusinessRegister, AuthController.businessRegister);

// Send Email OTP API
router.post('/send-email-otp', validateSendEmailOTP, AuthController.sendEmailOTP);

// Send Phone OTP API
router.post('/send-phone-otp', validateSendPhoneOTP, AuthController.sendPhoneOTP);

// Confirm OTP API (for any identifier, not just users in DB)
router.post('/confirm-otp', validateConfirmOTP, AuthController.confirmOTP);

// Login API
router.post('/login', validateLogin, AuthController.login);

// Login with OTP API
router.post('/login-with-otp', validateLoginWithOTP, AuthController.loginWithOTP);

// Forgot Password API
router.post('/forgot-password', validateForgotPassword, verifyToken, AuthController.forgotPassword);

// Confirm Login OTP API (for existing users, returns user data)
router.post('/confirm-login-otp', validateConfirmOTP, AuthController.confirmLoginOTP);

// Create Admin User (admin only)
router.post('/create-admin', verifyToken, validateRegister, AuthController.createAdminUser);

// Create Magnet Employee User (admin only)
router.post('/create-magnet-employee', verifyToken, validateRegister, AuthController.createMagnetEmployeeUser);

module.exports = router;
