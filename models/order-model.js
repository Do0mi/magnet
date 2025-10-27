const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

// Order status constants
const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed', 
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

// Status mapping for bilingual support
const STATUS_MAPPING = {
  [ORDER_STATUS.PENDING]: { en: 'pending', ar: 'قيد الانتظار' },
  [ORDER_STATUS.CONFIRMED]: { en: 'confirmed', ar: 'مؤكد' },
  [ORDER_STATUS.SHIPPED]: { en: 'shipped', ar: 'تم الشحن' },
  [ORDER_STATUS.DELIVERED]: { en: 'delivered', ar: 'تم التوصيل' },
  [ORDER_STATUS.CANCELLED]: { en: 'cancelled', ar: 'ملغي' }
};

// Order item schema
const orderItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  unitPrice: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  itemTotal: { 
    type: Number, 
    required: true, 
    min: 0 
  }
});

// Status log schema
const statusLogSchema = new mongoose.Schema({
  status: bilingualFieldSchema,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String }
});

// Main order schema
const orderSchema = new mongoose.Schema({
  customer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [orderItemSchema],
  subtotal: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  shippingCost: { 
    type: Number, 
    default: 0 
  },
  total: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  shippingAddress: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Address' 
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  paymentMethod: {
    type: String,
    default: 'Cash on delivery'
  },
  cancelledReason: {
    type: String,
    required: function() {
      return this.status === ORDER_STATUS.CANCELLED;
    }
  },
  statusLog: [statusLogSchema],
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// Static methods
orderSchema.statics.getStatusMapping = () => STATUS_MAPPING;
orderSchema.statics.getOrderStatus = () => ORDER_STATUS;
orderSchema.statics.convertToBilingual = (status) => STATUS_MAPPING[status];

// Instance methods
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.itemTotal, 0);
  this.total = this.subtotal + this.shippingCost;
  return this.total;
};

orderSchema.methods.addStatusLog = function(status, updatedBy, note = '') {
  this.statusLog.push({
    status: STATUS_MAPPING[status],
    timestamp: new Date(),
    updatedBy,
    note
  });
};

orderSchema.methods.updateStatus = function(newStatus, updatedBy, note = '') {
  this.status = newStatus;
  this.addStatusLog(newStatus, updatedBy, note);
  this.updatedAt = new Date();
};

// Pre-save middleware to calculate totals
orderSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

module.exports = mongoose.model('Order', orderSchema); 