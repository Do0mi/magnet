const express = require('express');
const passport = require('passport');
const router = express.Router();
const AuthController = require('../../../controllers/user/auth/auth-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { authLimiter, strictLimiter } = require('../../../middleware/rate-limit-middleware');
const { 
  validateRegister, 
  validateBusinessRegister, 
  validateSendEmailOTP, 
  validateConfirmOTP, 
  validateLogin, 
  validateLoginWithOTP, 
  validateForgotPassword 
} = require('../../../middleware/validation-middleware');

// POST /api/v1/user/auth/register - Register user (rate limited)
router.post('/register', authLimiter, validateRegister, AuthController.register);

// POST /api/v1/user/auth/business-request - Business registration request (rate limited)
router.post('/business-register', authLimiter, validateBusinessRegister, AuthController.businessRegister);

// POST /api/v1/user/auth/login - Login (rate limited)
router.post('/login', authLimiter, validateLogin, AuthController.login);

// POST /api/v1/user/auth/send-email-otp - Send Email OTP (strict rate limited)
router.post('/send-email-otp', strictLimiter, validateSendEmailOTP, AuthController.sendEmailOTP);

// POST /api/v1/user/auth/confirm-otp - Confirm OTP (strict rate limited)
router.post('/confirm-otp', strictLimiter, validateConfirmOTP, AuthController.confirmOTP);

// POST /api/v1/user/auth/login-with-otp - Login with OTP (strict rate limited)
router.post('/login-with-otp', strictLimiter, validateLoginWithOTP, AuthController.loginWithOTP);

// POST /api/v1/user/auth/confirm-login-otp - Confirm Login OTP (strict rate limited)
router.post('/confirm-login-otp', strictLimiter, validateConfirmOTP, AuthController.confirmLoginOTP);

// POST /api/v1/user/auth/password - Change password (requires authentication)
router.post('/password', verifyToken, AuthController.changePassword);

module.exports = router;
