const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user-model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateVerificationCode, sendVerificationEmail, generateOTP, sendOTPEmail, sendBusinessUnderReviewNotification } = require('../utils/email-utils');
const { generateSMSVerificationCode, sendSMSVerificationCode, generateOTP: generateSMSOTP, sendOTPSMS } = require('../utils/sms-utils');
const crypto = require('crypto');
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
const verifyToken = require('../middleware/auth-middleware');

// In-memory OTP store (for demo; use Redis or similar in production)
const otpStore = {};

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET || 'magnetprojecttokensecret',
    { expiresIn: '7d' }
  );
};

// Helper function to check if phone starts with Saudi code
const isSaudiPhone = (phone) => {
  return phone && (phone.startsWith('+966') || phone.startsWith('966') || phone.startsWith('00966'));
};

// Helper function to determine if identifier is email or phone
const getIdentifierType = (identifier) => {
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return emailRegex.test(identifier) ? 'email' : 'phone';
};

// Register API
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, country, language = 'en' } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Check if phone already exists (if provided)
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number already registered'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role: 'customer',
      country,
      language
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser._id,
          firstname: newUser.firstname,
          lastname: newUser.lastname,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          country: newUser.country,
          language: newUser.language,
          isEmailVerified: newUser.isEmailVerified,
          isPhoneVerified: newUser.isPhoneVerified
        },
        token
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Registration failed' 
    });
  }
});

// Business Register API
router.post('/business-register', validateBusinessRegister, async (req, res) => {
  try {
    const { 
      firstname, lastname, email, password, crNumber, vatNumber, 
      companyName, companyType, country, city, district, streetName, phone 
    } = req.body;

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already registered'
      });
    }

    // Check if phone already exists
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone number already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new business user
    const newBusiness = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role: 'business',
      country,
      businessInfo: {
        crNumber,
        vatNumber,
        companyName,
        companyType,
        city,
        district,
        streetName,
        isApproved: false,
        approvalStatus: 'pending'
      }
    });

    await newBusiness.save();

    // Send under review notification email
    await sendBusinessUnderReviewNotification(email, companyName);

    res.status(201).json({
      status: 'success',
      message: 'Business registration submitted successfully. Your application is under review.',
      data: {
        business: {
          id: newBusiness._id,
          companyName: newBusiness.businessInfo.companyName,
          approvalStatus: newBusiness.businessInfo.approvalStatus
        }
      }
    });
  } catch (err) {
    console.error('Business register error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Business registration failed' 
    });
  }
});

// Send Email OTP API
router.post('/send-email-otp', validateSendEmailOTP, async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in memory
    otpStore[email] = { code: otp, expiresAt };
    
    // Debug log
    console.log('OTP stored for:', email, 'OTP:', otp, 'Store size:', Object.keys(otpStore).length);

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp);

    if (!emailResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP email'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email successfully'
    });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to send OTP' 
    });
  }
});

// Send Phone OTP API
router.post('/send-phone-otp', validateSendPhoneOTP, async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if user exists
    const user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone already exists'
      });
    }

    // Generate OTP
    const otp = generateSMSOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in memory
    otpStore[phone] = { code: otp, expiresAt };

    // Send OTP SMS
    const smsResult = await sendOTPSMS(phone, otp);

    if (!smsResult.success) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP SMS'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your phone successfully'
    });
  } catch (err) {
    console.error('Send phone OTP error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to send OTP' 
    });
  }
});

// Confirm OTP API (for any identifier, not just users in DB)
router.post('/confirm-otp', validateConfirmOTP, async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    
    // Debug log
    console.log('Confirming OTP for:', identifier, 'OTP:', otp);
    console.log('Available OTPs in store:', Object.keys(otpStore));
    console.log('OTP data for identifier:', otpStore[identifier]);
    
    const otpData = otpStore[identifier];
    if (!otpData || !otpData.code) {
      return res.status(400).json({
        status: 'error',
        message: 'No OTP found for this identifier'
      });
    }
    if (otpData.code !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }
    if (otpData.expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired'
      });
    }
    // Optionally, remove OTP after successful confirmation
    delete otpStore[identifier];
    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (err) {
    console.error('Confirm OTP error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'OTP confirmation failed' 
    });
  }
});

// Login API
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };

    // For phone login, check if it's Saudi number
    if (identifierType === 'phone' && !isSaudiPhone(identifier)) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone login is only allowed for Saudi numbers'
      });
    }

    // Find user
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user can login (business must be approved)
    if (!user.canLogin()) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          country: user.country,
          language: user.language,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          businessInfo: user.businessInfo
        },
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Login failed' 
    });
  }
});

// Login with OTP API
router.post('/login-with-otp', validateLoginWithOTP, async (req, res) => {
  try {
    const { identifier } = req.body;

    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };

    // For phone login, check if it's Saudi number
    if (identifierType === 'phone' && !isSaudiPhone(identifier)) {
      return res.status(400).json({
        status: 'error',
        message: 'Phone login is only allowed for Saudi numbers'
      });
    }

    // Find user
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user can login (business must be approved)
    if (!user.canLogin()) {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active. Please contact support.'
      });
    }

    // Generate OTP
    const otp = identifierType === 'email' ? generateOTP() : generateSMSOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP to user
    const otpField = identifierType === 'email' ? 'emailOTP' : 'phoneOTP';
    user[otpField] = {
      code: otp,
      expiresAt
    };
    await user.save();

    // Send OTP
    let sendResult;
    if (identifierType === 'email') {
      sendResult = await sendOTPEmail(identifier, otp);
    } else {
      sendResult = await sendOTPSMS(identifier, otp);
    }

    if (!sendResult.success) {
      return res.status(500).json({
        status: 'error',
        message: `Failed to send OTP to ${identifierType}`
      });
    }

    res.status(200).json({
      status: 'success',
      message: `OTP sent to your ${identifierType} successfully`
    });
  } catch (err) {
    console.error('Login with OTP error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Login with OTP failed' 
    });
  }
});

// Forgot Password API
router.post('/forgot-password', validateForgotPassword, verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Password update failed' 
    });
  }
});

// Confirm Login OTP API (for existing users, returns user data)
router.post('/confirm-login-otp', validateConfirmOTP, async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
    // Find user
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    // Check OTP (from user model)
    const otpField = identifierType === 'email' ? 'emailOTP' : 'phoneOTP';
    if (!user[otpField] || !user[otpField].code) {
      return res.status(400).json({
        status: 'error',
        message: 'No OTP found for this user'
      });
    }
    if (user[otpField].code !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP'
      });
    }
    if (user[otpField].expiresAt < new Date()) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired'
      });
    }
    // Mark as verified and clear OTP
    const verificationField = identifierType === 'email' ? 'isEmailVerified' : 'isPhoneVerified';
    user[verificationField] = true;
    user[otpField] = null;
    await user.save();
    // Generate token
    const token = generateToken(user);
    res.status(200).json({
      status: 'success',
      message: `${identifierType === 'email' ? 'Email' : 'Phone'} verified and login successful`,
      data: {
        user: {
          id: user._id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          country: user.country,
          language: user.language,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          businessInfo: user.businessInfo
        },
        token
      }
    });
  } catch (err) {
    console.error('Confirm Login OTP error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'OTP confirmation failed' 
    });
  }
});

module.exports = router;
