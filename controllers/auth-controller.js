// Auth Controller
const User = require('../models/user-model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateVerificationCode, sendVerificationEmail, generateOTP, sendOTPEmail, generateBusinessUnderReviewNotification } = require('../utils/email-utils');
const { generateSMSVerificationCode, sendSMSVerificationCode, generateOTP: generateSMSOTP, sendOTPSMS } = require('../utils/sms-utils');
const { getBilingualMessage } = require('../utils/messages');
const crypto = require('crypto');

// In-memory OTP store (for demo; use Redis or similar in production)
const otpStore = {};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'magnetprojecttokensecret',
    { expiresIn: '7d' }
  );
};

const isSaudiPhone = (phone) => {
  return phone && (phone.startsWith('+966') || phone.startsWith('966') || phone.startsWith('00966'));
};

const getIdentifierType = (identifier) => {
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  return emailRegex.test(identifier) ? 'email' : 'phone';
};

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, country, language = 'en' } = req.body;
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('email_already_registered') });
    }
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('phone_already_registered') });
      }
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let isEmailVerified = false;
    let isPhoneVerified = false;
    if (phone && isSaudiPhone(phone)) {
      isPhoneVerified = true;
      isEmailVerified = false;
    } else {
      isEmailVerified = true;
      isPhoneVerified = false;
    }
    const newUser = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role: 'customer',
      country,
      language,
      isEmailVerified,
      isPhoneVerified
    });
    await newUser.save();
    const token = generateToken(newUser);
    res.status(201).json({
      status: 'success',
      message: getBilingualMessage('user_registered_successfully'),
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
          imageUrl: newUser.imageUrl,
          isEmailVerified: newUser.isEmailVerified,
          isPhoneVerified: newUser.isPhoneVerified
        },
        token
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('registration_failed') });
  }
};

exports.businessRegister = async (req, res) => {
  try {
    const { firstname, lastname, email, password, crNumber, vatNumber, companyName, companyType, country, city, district, streetName, phone } = req.body;
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('email_already_registered') });
    }
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('phone_already_registered') });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let isEmailVerified = false;
    let isPhoneVerified = false;
    if (phone) {
      isPhoneVerified = true;
      isEmailVerified = false;
    }
    const newBusiness = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role: 'business',
      country,
      isEmailVerified,
      isPhoneVerified,
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
    await sendBusinessUnderReviewNotification(email, companyName);
    res.status(201).json({
      status: 'success',
      message: getBilingualMessage('business_registration_submitted'),
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
    res.status(500).json({ status: 'error', message: getBilingualMessage('business_registration_failed') });
  }
};

exports.sendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('email_already_exists') });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpStore[email] = { code: otp, expiresAt };
    const emailResult = await sendOTPEmail(email, otp);
    if (!emailResult.success) {
      return res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp_email') });
    }
    res.status(200).json({ status: 'success', message: getBilingualMessage('otp_sent_email_success') });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp') });
  }
};

exports.sendPhoneOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    const user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('phone_already_exists') });
    }
    const otp = generateSMSOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpStore[phone] = { code: otp, expiresAt };
    const smsResult = await sendOTPSMS(phone, otp);
    if (!smsResult.success) {
      return res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp_sms') });
    }
    res.status(200).json({ status: 'success', message: getBilingualMessage('otp_sent_phone_success') });
  } catch (err) {
    console.error('Send phone OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp') });
  }
};

exports.confirmOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const otpData = otpStore[identifier];
    if (!otpData || !otpData.code) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('no_otp_found') });
    }
    if (otpData.code !== otp) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_otp') });
    }
    if (otpData.expiresAt < new Date()) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('otp_expired') });
    }
    delete otpStore[identifier];
    res.status(200).json({ status: 'success', message: getBilingualMessage('otp_verified_success') });
  } catch (err) {
    console.error('Confirm OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('otp_confirmation_failed') });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
    if (identifierType === 'phone' && !isSaudiPhone(identifier)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('phone_login_saudi_only') });
    }
    const user = await User.findOne(query);
    if (!user) {
      return res.status(401).json({ status: 'error', message: getBilingualMessage('invalid_credentials') });
    }
    if (!user.canLogin()) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('account_not_active') });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ status: 'error', message: getBilingualMessage('invalid_credentials') });
    }
    const token = generateToken(user);
    res.status(200).json({
      status: 'success',
      message: getBilingualMessage('login_successful'),
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
          imageUrl: user.imageUrl,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          businessInfo: user.businessInfo
        },
        token
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('login_failed') });
  }
};

exports.loginWithOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
    if (identifierType === 'phone' && !isSaudiPhone(identifier)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('phone_login_saudi_only') });
    }
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    if (!user.canLogin()) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('account_not_active') });
    }
    const otp = identifierType === 'email' ? generateOTP() : generateSMSOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const otpField = identifierType === 'email' ? 'emailOTP' : 'phoneOTP';
    user[otpField] = { code: otp, expiresAt };
    await user.save();
    let sendResult;
    if (identifierType === 'email') {
      sendResult = await sendOTPEmail(identifier, otp);
    } else {
      sendResult = await sendOTPSMS(identifier, otp);
    }
    if (!sendResult.success) {
      return res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp_to') });
    }
    res.status(200).json({ status: 'success', message: getBilingualMessage('otp_sent_to_success') });
  } catch (err) {
    console.error('Login with OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('login_with_otp_failed') });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    user.updatedAt = new Date();
    await user.save();
    res.status(200).json({ status: 'success', message: getBilingualMessage('password_updated_success') });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('password_update_failed') });
  }
};

exports.confirmLoginOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const identifierType = getIdentifierType(identifier);
    const query = identifierType === 'email' ? { email: identifier } : { phone: identifier };
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    const otpField = identifierType === 'email' ? 'emailOTP' : 'phoneOTP';
    if (!user[otpField] || !user[otpField].code) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('no_otp_found_user') });
    }
    if (user[otpField].code !== otp) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_otp') });
    }
    if (user[otpField].expiresAt < new Date()) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('otp_expired') });
    }
    const verificationField = identifierType === 'email' ? 'isEmailVerified' : 'isPhoneVerified';
    user[verificationField] = true;
    user[otpField] = null;
    await user.save();
    const token = generateToken(user);
    res.status(200).json({
      status: 'success',
      message: getBilingualMessage('email_phone_verified_login'),
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
          imageUrl: user.imageUrl,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
          businessInfo: user.businessInfo
        },
        token
      }
    });
  } catch (err) {
    console.error('Confirm Login OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('otp_confirmation_failed') });
  }
}; 