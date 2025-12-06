const mongoose = require('mongoose');

// FCM Token schema
const fcmTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
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

// Note: unique: true on userId field already creates a unique index
// No need for additional schema.index() call

module.exports = mongoose.model('FCMToken', fcmTokenSchema);
