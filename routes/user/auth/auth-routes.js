const express = require('express');
const passport = require('passport');
const router = express.Router();
const AuthController = require('../../../controllers/user/auth/auth-controller');
const verifyToken = require('../../../middleware/auth-middleware');
const { 
  validateRegister, 
  validateBusinessRegister, 
  validateSendEmailOTP, 
  validateSendPhoneOTP, 
  validateConfirmOTP, 
  validateLogin, 
  validateLoginWithOTP, 
  validateForgotPassword 
} = require('../../../middleware/validation-middleware');

// POST /api/v1/user/auth/register - Register user
router.post('/register', validateRegister, AuthController.register);

// POST /api/v1/user/auth/business-request - Business registration request
router.post('/business-request', validateBusinessRegister, AuthController.businessRegister);

// POST /api/v1/user/auth/login - Login
router.post('/login', validateLogin, AuthController.login);

// POST /api/v1/user/auth/send-email-otp - Send Email OTP
router.post('/send-email-otp', validateSendEmailOTP, AuthController.sendEmailOTP);

// POST /api/v1/user/auth/send-phone-otp - Send Phone OTP
router.post('/send-phone-otp', validateSendPhoneOTP, AuthController.sendPhoneOTP);

// POST /api/v1/user/auth/confirm-otp - Confirm OTP
router.post('/confirm-otp', validateConfirmOTP, AuthController.confirmOTP);

// POST /api/v1/user/auth/login-with-otp - Login with OTP
router.post('/login-with-otp', validateLoginWithOTP, AuthController.loginWithOTP);

// POST /api/v1/user/auth/confirm-login-otp - Confirm Login OTP
router.post('/confirm-login-otp', validateConfirmOTP, AuthController.confirmLoginOTP);

// POST /api/v1/user/auth/password - Change password (requires authentication)
router.post('/password', verifyToken, AuthController.changePassword);

module.exports = router;
