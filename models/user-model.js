const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Basic user information
  firstname: {
    type: String,
    required: true,
    trim: true
  },
  lastname: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true,
    index: true,
    sparse: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'magnet_employee', 'business', 'customer'],
    default: 'customer'
  },
  country: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'ar']
  },
  
  // Verification fields
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isPhoneVerified: {
    type: Boolean,
    default: false
  },
  emailOTP: {
    code: String,
    expiresAt: Date
  },
  phoneOTP: {
    code: String,
    expiresAt: Date
  },
  
  // Business specific fields
  businessInfo: {
    crNumber: String,
    vatNumber: String,
    companyName: String,
    companyType: String,
    city: String,
    district: String,
    streetName: String,
    isApproved: {
      type: Boolean,
      default: false
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    rejectionReason: String
  },
  
  // Password reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },

  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
// userSchema.index({ email: 1 });
// userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.approvalStatus': 1 });

// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to generate OTP
userSchema.methods.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Method to check if user can login (business must be approved)
userSchema.methods.canLogin = function() {
  if (this.role === 'business') {
    return this.businessInfo.isApproved && this.businessInfo.approvalStatus === 'approved';
  }
  return true;
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstname} ${this.lastname}`;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.getFullName();
});

// Virtual for identifier (email or phone)
userSchema.virtual('identifier').get(function() {
  return this.email || this.phone || null;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.emailOTP;
    delete ret.phoneOTP;
    delete ret.passwordResetToken;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
