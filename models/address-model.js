const mongoose = require('mongoose');

// Bilingual field schema
const bilingualFieldSchema = {
  en: { type: String, required: true },
  ar: { type: String, required: true }
};

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  addressLine1: bilingualFieldSchema,
  addressLine2: bilingualFieldSchema,
  city: bilingualFieldSchema,
  state: bilingualFieldSchema,
  postalCode: String,
  country: bilingualFieldSchema,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to get address data in specific language
addressSchema.methods.getLocalizedData = function(language = 'en') {
  const address = this.toObject();
  
  // Convert bilingual fields to single language
  if (address.addressLine1) {
    address.addressLine1 = address.addressLine1[language] || address.addressLine1.en;
  }
  if (address.addressLine2) {
    address.addressLine2 = address.addressLine2[language] || address.addressLine2.en;
  }
  if (address.city) {
    address.city = address.city[language] || address.city.en;
  }
  if (address.state) {
    address.state = address.state[language] || address.state.en;
  }
  if (address.country) {
    address.country = address.country[language] || address.country.en;
  }
  
  return address;
};

module.exports = mongoose.model('Address', addressSchema); 