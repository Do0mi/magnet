const { body, validationResult } = require('express-validator');

// Validation helper
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
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
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please provide a valid email address'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be either "en" or "ar"'),
  handleValidationErrors
];

// Business register validation
const validateBusinessRegister = [
  body('firstname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastname')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('crNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('CR number is required and must be between 1 and 50 characters'),
  body('vatNumber')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('VAT number is required and must be between 1 and 50 characters'),
  body('companyName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('companyType')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company type must be between 2 and 100 characters'),
  body('country')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('City must be between 2 and 50 characters'),
  body('district')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('District must be between 2 and 50 characters'),
  body('streetName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Street name must be between 2 and 100 characters'),
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Send email OTP validation
const validateSendEmailOTP = [
  body('email')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    .withMessage('Please provide a valid email address'),
  handleValidationErrors
];

// Send phone OTP validation
const validateSendPhoneOTP = [
  body('phone')
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Confirm OTP validation
const validateConfirmOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone is required'),
  body('otp')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('OTP must be a 6-digit number'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Login with OTP validation
const validateLoginWithOTP = [
  body('identifier')
    .notEmpty()
    .withMessage('Email or phone is required'),
  handleValidationErrors
];

// Forgot password validation
const validateForgotPassword = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  handleValidationErrors
];

// Update profile validation
const validateUpdateProfile = [
  body('firstname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastname')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Country must be between 2 and 50 characters'),
  body('language')
    .optional()
    .isIn(['en', 'ar'])
    .withMessage('Language must be either "en" or "ar"'),
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Please provide a valid image URL'),
  handleValidationErrors
];

// Business approval validation
const validateBusinessApproval = [
  body('businessId')
    .isMongoId()
    .withMessage('Valid business ID is required'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either "approved" or "rejected"'),
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reason must be between 1 and 500 characters'),
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateBusinessRegister,
  validateSendEmailOTP,
  validateSendPhoneOTP,
  validateConfirmOTP,
  validateLogin,
  validateLoginWithOTP,
  validateForgotPassword,
  validateUpdateProfile,
  validateBusinessApproval,
  handleValidationErrors
}; 