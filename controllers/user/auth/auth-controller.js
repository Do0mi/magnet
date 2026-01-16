// User Auth Controller - User Authentication Management
const User = require('../../../models/user-model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateOTP, sendOTPEmail, sendBusinessUnderReviewNotification } = require('../../../utils/email-utils');
const { getBilingualMessage } = require('../../../utils/messages');
const { formatUser, createResponse } = require('../../../utils/response-formatters');

// In-memory OTP store (for demo; use Redis or similar in production)
const otpStore = {};

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
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

// POST /api/v1/user/auth/register - Register user
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
    } else if (email) {
      isEmailVerified = true;
      isPhoneVerified = false;
    }
    const user = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role: 'customer',
      country,
      language,
      isEmailVerified,
      isPhoneVerified,
      isAllowed: true
    });
    await user.save();
    const token = generateToken(user);
    res.status(201).json(createResponse('success', {
      user: formatUser(user),
      token
    }, getBilingualMessage('registration_success')));
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('registration_failed') });
  }
};

// POST /api/v1/user/auth/business-register - Business Register
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
      role: User.getUserRoles().BUSINESS,
      country,
      isEmailVerified,
      isPhoneVerified,
      businessInfo: {
        crNumber,
        vatNumber,
        companyName,
        companyType,
        address: {
          city,
          district,
          streetName
        },
        approvalStatus: User.getBusinessStatus().PENDING
      }
    });
    await newBusiness.save();
    await sendBusinessUnderReviewNotification(email, companyName);
    res.status(201).json(createResponse('success', {
      business: formatUser(newBusiness, { 
        includeVerification: false,
        includeBusinessInfo: true 
      })
    }, getBilingualMessage('business_registration_submitted')));
  } catch (err) {
    console.error('Business register error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('business_registration_failed') });
  }
};

// POST /api/v1/user/auth/send-email-otp - Send Email OTP
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

// POST /api/v1/user/auth/confirm-otp - Confirm OTP
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

// POST /api/v1/user/auth/login - Login
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const identifierType = getIdentifierType(identifier);
    const user = await User.findOne(identifierType === 'email' ? { email: identifier } : { phone: identifier })
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    if (!user) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_credentials') });
    }
    if (!user.isAllowed) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('account_not_allowed') });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_credentials') });
    }
    const token = generateToken(user);
    res.status(200).json(createResponse('success', {
      user: formatUser(user, { includeBusinessInfo: true }),
      token
    }, getBilingualMessage('login_success')));
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('login_failed') });
  }
};

// POST /api/v1/user/auth/login-with-otp - Login with OTP (Email only)
exports.loginWithOTP = async (req, res) => {
  try {
    const { identifier } = req.body;
    const identifierType = getIdentifierType(identifier);
    
    // Only allow email for OTP login
    if (identifierType !== 'email') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('email_required_for_otp_login') });
    }
    
    const user = await User.findOne({ email: identifier });
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    if (!user.canLogin()) {
      if (user.isDisallowed) {
        return res.status(403).json({ status: 'error', message: getBilingualMessage('account_disallowed') });
      }
      return res.status(403).json({ status: 'error', message: getBilingualMessage('account_not_active') });
    }
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.emailOTP = { code: otp, expiresAt };
    await user.save();
    const sendResult = await sendOTPEmail(identifier, otp);
    if (!sendResult.success) {
      return res.status(500).json({ status: 'error', message: getBilingualMessage('failed_send_otp_to') });
    }
    res.status(200).json({ status: 'success', message: getBilingualMessage('otp_sent_to_success') });
  } catch (err) {
    console.error('Login with OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('login_with_otp_failed') });
  }
};

// POST /api/v1/user/auth/confirm-login-otp - Confirm Login OTP (Email only)
exports.confirmLoginOTP = async (req, res) => {
  try {
    const { identifier, otp } = req.body;
    const identifierType = getIdentifierType(identifier);
    
    // Only allow email for OTP login
    if (identifierType !== 'email') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('email_required_for_otp_login') });
    }
    
    const user = await User.findOne({ email: identifier })
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    if (!user.emailOTP || !user.emailOTP.code) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('no_otp_found_user') });
    }
    if (user.emailOTP.code !== otp) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_otp') });
    }
    if (user.emailOTP.expiresAt < new Date()) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('otp_expired') });
    }
    user.isEmailVerified = true;
    user.emailOTP = null;
    await user.save();
    await user.populate('businessInfo.approvedBy', 'firstname lastname email role');
    const token = generateToken(user);
    res.status(200).json(createResponse('success', {
      user: formatUser(user, { includeBusinessInfo: true }),
      token
    }, getBilingualMessage('email_phone_verified_login')));
  } catch (err) {
    console.error('Confirm Login OTP error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('otp_confirmation_failed') });
  }
};

// POST /api/v1/user/password - Change password (requires authentication)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_current_password')
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await User.findByIdAndUpdate(req.user.id, {
      password: hashedNewPassword,
      updatedAt: Date.now()
    });

    res.status(200).json(createResponse('success', null, getBilingualMessage('password_changed_success')));

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_change_password')
    });
  }
};
