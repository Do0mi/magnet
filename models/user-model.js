const mongoose = require('mongoose');

// User roles constants
const USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYEE: 'magnet_employee', 
  BUSINESS: 'business',
  CUSTOMER: 'customer'
};

// Business approval status
const BUSINESS_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// OTP schema for verification
const otpSchema = {
  code: { type: String },
  expiresAt: { type: Date }
};

// Business information schema
const businessInfoSchema = {
  companyName: { type: String, trim: true },
  crNumber: { type: String, trim: true },
  vatNumber: { type: String, trim: true },
  companyType: { type: String, trim: true },
  address: {
    city: { type: String, trim: true },
    district: { type: String, trim: true },
    streetName: { type: String, trim: true }
  },
  approvalStatus: {
    type: String,
    enum: Object.values(BUSINESS_STATUS),
    default: BUSINESS_STATUS.PENDING
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectionReason: { type: String }
};

// Main user schema
const userSchema = new mongoose.Schema({
  // Basic information
  firstname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Role and permissions
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER
  },
  
  // Profile information
  country: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    enum: ['en', 'ar'],
    default: 'en'
  },
  imageUrl: {
    type: String,
    trim: true
  },
  
  // Verification status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  isAllowed: {
    type: Boolean,
    default: true
  },
  
  // Disallow information (for customer users)
  disallowReason: { type: String },
  disallowedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  disallowedAt: { type: Date },
  
  // Business information (only for business users)
  businessInfo: businessInfoSchema,
  
  // Verification codes
  emailOTP: otpSchema,
  phoneOTP: otpSchema,
  
  // Password reset
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  
  // Access pages for dashboard
  accessPages: {
    dashboard: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    users: { type: Boolean, default: false },
    products: { type: Boolean, default: false },
    orders: { type: Boolean, default: false },
    reviews: { type: Boolean, default: false },
    wishlists: { type: Boolean, default: false },
    categories: { type: Boolean, default: false },
    addresses: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.approvalStatus': 1 });
userSchema.index({ isAllowed: 1 });

// Instance methods
userSchema.methods.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

userSchema.methods.getFullName = function() {
  return `${this.firstname} ${this.lastname}`;
};

userSchema.methods.canLogin = function() {
  if (!this.isAllowed) return false;
  
  if (this.role === USER_ROLES.BUSINESS) {
    return this.businessInfo.approvalStatus === BUSINESS_STATUS.APPROVED;
  }
  
  return true;
};

userSchema.methods.isBusinessApproved = function() {
  return this.role === USER_ROLES.BUSINESS && 
         this.businessInfo.approvalStatus === BUSINESS_STATUS.APPROVED;
};

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

userSchema.virtual('identifier').get(function() {
  return this.email || this.phone || null;
});

// JSON transformation to exclude sensitive data
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailOTP;
    delete ret.phoneOTP;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  }
});

// Pre-save middleware to set access pages based on role
userSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('role')) {
    if (this.role === USER_ROLES.ADMIN) {
      // Admin has access to all pages
      this.accessPages = {
        dashboard: true,
        analytics: true,
        users: true,
        products: true,
        orders: true,
        reviews: true,
        wishlists: true,
        categories: true,
        addresses: true
      };
    } else if (this.role === USER_ROLES.EMPLOYEE) {
      // Employee access is managed by admin - keep existing values or set defaults
      if (!this.accessPages) {
        this.accessPages = {
          dashboard: false,
          analytics: false,
          users: false,
          products: false,
          orders: false,
          reviews: false,
          wishlists: false,
          categories: false,
          addresses: false
        };
      }
    } else {
      // Customer and Business have no access to dashboard pages
      this.accessPages = {
        dashboard: false,
        analytics: false,
        users: false,
        products: false,
        orders: false,
        reviews: false,
        wishlists: false,
        categories: false,
        addresses: false
      };
    }
  }
  next();
});

// Static methods
userSchema.statics.getUserRoles = () => USER_ROLES;
userSchema.statics.getBusinessStatus = () => BUSINESS_STATUS;

module.exports = mongoose.model('User', userSchema);
