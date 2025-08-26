const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

// Status enums for both languages
const statusEnums = {
  en: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
  ar: ['قيد الانتظار', 'مؤكد', 'تم الشحن', 'تم التوصيل', 'ملغي']
};

// Status mapping for easy conversion
const statusMapping = {
  pending: { en: 'pending', ar: 'قيد الانتظار' },
  confirmed: { en: 'confirmed', ar: 'مؤكد' },
  shipped: { en: 'shipped', ar: 'تم الشحن' },
  delivered: { en: 'delivered', ar: 'تم التوصيل' },
  cancelled: { en: 'cancelled', ar: 'ملغي' }
};

// Get all valid English status values
const validEnglishStatuses = Object.keys(statusMapping);

const statusLogSchema = new mongoose.Schema({
  status: bilingualFieldSchema,
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      itemTotal: { type: Number, required: true } // Store calculated item total
    }
  ],
  total: { type: Number, required: true, default: 0 }, // Store total order amount
  shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  status: bilingualFieldSchema,
  statusLog: [statusLogSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to get order data in specific language
orderSchema.methods.getLocalizedData = function(language = 'en') {
  const order = this.toObject();
  
  // If language is 'both', return the bilingual objects as they are
  if (language === 'both') {
    return order;
  }
  
  // Convert bilingual status to single language
  if (order.status) {
    order.status = order.status[language] || order.status.en;
  }
  
  // Convert status log entries
  if (order.statusLog && Array.isArray(order.statusLog)) {
    order.statusLog = order.statusLog.map(log => ({
      ...log,
      status: log.status[language] || log.status.en
    }));
  }
  
  return order;
};

// Static method to convert English status to bilingual
orderSchema.statics.convertStatusToBilingual = function(englishStatus) {
  if (!validEnglishStatuses.includes(englishStatus)) {
    throw new Error(`Invalid status: ${englishStatus}. Valid statuses are: ${validEnglishStatuses.join(', ')}`);
  }
  return statusMapping[englishStatus];
};

// Static method to get status mapping
orderSchema.statics.getStatusMapping = function() {
  return statusMapping;
};

// Static method to get status enums
orderSchema.statics.getStatusEnums = function() {
  return statusEnums;
};

// Static method to get valid English statuses
orderSchema.statics.getValidEnglishStatuses = function() {
  return validEnglishStatuses;
};

// Static method to validate if a status is valid
orderSchema.statics.isValidStatus = function(status) {
  return validEnglishStatuses.includes(status);
};

// Static method to get status in specific language
orderSchema.statics.getStatusInLanguage = function(englishStatus, language = 'en') {
  if (!validEnglishStatuses.includes(englishStatus)) {
    throw new Error(`Invalid status: ${englishStatus}`);
  }
  return statusMapping[englishStatus][language] || statusMapping[englishStatus].en;
};

// Method to calculate and update total (requires products to be populated or prices provided)
orderSchema.methods.calculateTotal = function(productPrices = {}) {
  let total = 0;
  this.items.forEach(item => {
    let price = 0;
    
    // If product is populated, use its pricePerUnit
    if (item.product && typeof item.product === 'object' && item.product.pricePerUnit) {
      price = parseFloat(item.product.pricePerUnit) || 0;
    }
    // If productPrices object is provided, use it
    else if (productPrices[item.product]) {
      price = productPrices[item.product];
    }
    
    if (price > 0 && item.quantity) {
      item.itemTotal = price * item.quantity;
      total += item.itemTotal;
    }
  });
  this.total = total;
  return this.total;
};

module.exports = mongoose.model('Order', orderSchema); 