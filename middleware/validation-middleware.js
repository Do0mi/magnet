const { body, validationResult } = require('express-validator');
const { getBilingualMessage } = require('../utils/messages');

const toBilingualMessage = (message) => {
  if (!message) {
    return getBilingualMessage('unknown_error');
  }

  if (typeof message === 'object' && message.en && message.ar) {
    return message;
  }

  return getBilingualMessage(message);
};

// Validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: getBilingualMessage('validation_failed'),
      errors: errors.array().map(err => ({
        field: err.path,
        message: toBilingualMessage(err.msg)
      }))
    });
  }
  next();
};

// Register validation
const validateRegister = [
  body('firstname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('firstname_length_range'),
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('lastname_length_range'),
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('email_valid_required'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('phone_valid_required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('password_min_length')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('password_complexity_requirement'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('country_length_range'),
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('language_allowed_values'),
  handleValidationErrors
];

// Business register validation
const validateBusinessRegister = [
  body('firstname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('firstname_length_range'),
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('lastname_length_range'),
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('email_valid_required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('password_min_length')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('password_complexity_requirement'),
  body('crNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('cr_number_required_range'),
  body('vatNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('vat_number_required_range'),
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('company_name_length_range'),
  body('companyType')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('company_type_length_range'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('country_length_range'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('city_length_range'),
  body('district')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('district_length_range'),
  body('streetName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('street_name_length_range'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('phone_valid_required'),
  handleValidationErrors
];

// Send email OTP validation
const validateSendEmailOTP = [
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('email_valid_required'),
  handleValidationErrors
];


// Confirm OTP validation
const validateConfirmOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('identifier_required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('otp_six_digits'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('identifier_required'),
  body('password')
    .notEmpty()
    .withMessage('password_required'),
  handleValidationErrors
];

// Login with OTP validation
const validateLoginWithOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('identifier_required'),
  handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('password_min_length')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('password_complexity_requirement'),
  handleValidationErrors
];

// Update profile validation
const validateUpdateProfile = [
  body('firstname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('firstname_length_range'),
  body('lastname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('lastname_length_range'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('phone_valid_required'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('country_length_range'),
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('language_allowed_values'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('image_url_invalid'),
  handleValidationErrors
];

// Business approval validation
const validateBusinessApproval = [
  body('businessId')
    .isMongoId()
    .withMessage('business_id_required'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('status_allowed_values'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('reason_length_range'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateBusinessRegister,
  validateSendEmailOTP,
  validateConfirmOTP,
  validateLogin,
  validateLoginWithOTP,
  validateForgotPassword,
  validateUpdateProfile,
  validateBusinessApproval,
  handleValidationErrors
}; 