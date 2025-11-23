const mongoose = require('mongoose');

// Special order status constants
const SPECIAL_ORDER_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  CONTACTED: 'contacted',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Special order schema
const specialOrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  needs: {
    type: String,
    required: true,
    trim: true
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: Object.values(SPECIAL_ORDER_STATUS),
    default: SPECIAL_ORDER_STATUS.PENDING
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
specialOrderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
specialOrderSchema.index({ userId: 1, createdAt: -1 });
specialOrderSchema.index({ productId: 1 });
specialOrderSchema.index({ status: 1 });

const SpecialOrder = mongoose.model('SpecialOrder', specialOrderSchema);

module.exports = SpecialOrder;
module.exports.SPECIAL_ORDER_STATUS = SPECIAL_ORDER_STATUS;

