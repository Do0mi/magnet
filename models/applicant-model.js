const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 150
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female'],
    trim: true
  },
  cv: {
    type: Buffer
  },
  cvContentType: {
    type: String,
    default: 'application/pdf'
  },
  has_cv: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  links: {
    type: [String],
    default: [],
    validate: {
      validator: function(links) {
        return links.length <= 5;
      },
      message: 'Links array cannot contain more than 5 items'
    }
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
applicantSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Applicant', applicantSchema);

