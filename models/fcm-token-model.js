const mongoose = require('mongoose');

// FCM Token schema
const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  token: {
    type: String,
    required: true,
    trim: true
  },
  deviceInfo: {
    userAgent: { type: String },
    platform: { type: String }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure unique index on userId (one token per user)
fcmTokenSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('FCMToken', fcmTokenSchema);
