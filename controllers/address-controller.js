const Address = require('../models/address-model');
const { getBilingualMessage } = require('../utils/messages');

// Helper function to format address data with localization
const formatAddress = (address, language = 'en') => {
  if (!address) return address;
  
  const obj = address.toObject ? address.toObject() : address;
  
  // Convert bilingual fields to single language
  if (obj.addressLine1) {
    obj.addressLine1 = obj.addressLine1[language] || obj.addressLine1.en;
  }
  if (obj.addressLine2) {
    obj.addressLine2 = obj.addressLine2[language] || obj.addressLine2.en;
  }
  if (obj.city) {
    obj.city = obj.city[language] || obj.city.en;
  }
  if (obj.state) {
    obj.state = obj.state[language] || obj.state.en;
  }
  if (obj.country) {
    obj.country = obj.country[language] || obj.country.en;
  }
  
  return obj;
};

// GET /addresses
exports.getAddresses = async (req, res) => {
  try {
    const language = req.query.lang || 'en';
    const addresses = await Address.find({ user: req.user.id });
    
    const formattedAddresses = addresses.map(address => formatAddress(address, language));
    
    res.status(200).json({ status: 'success', data: { addresses: formattedAddresses } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_addresses') });
  }
};

// POST /addresses
exports.addAddress = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    // Validate bilingual fields
    if (!addressLine1 || !addressLine1.en || !addressLine1.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('address_line1_required_both_languages') });
    }
    
    if (addressLine2 && (!addressLine2.en || !addressLine2.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('address_line2_required_both_languages') });
    }
    
    if (!city || !city.en || !city.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('city_required_both_languages') });
    }
    
    if (!state || !state.en || !state.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('state_required_both_languages') });
    }
    
    if (!country || !country.en || !country.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('country_required_both_languages') });
    }
    
    const address = new Address({
      user: req.user.id,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    });
    await address.save();
    
    const language = req.query.lang || 'en';
    const formattedAddress = formatAddress(address, language);
    
    res.status(201).json({ status: 'success', message: getBilingualMessage('address_added'), data: { address: formattedAddress } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_address') });
  }
};

// PUT /addresses/:id
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address || address.user.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    // Validate bilingual fields if provided
    if (addressLine1 && (!addressLine1.en || !addressLine1.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('address_line1_required_both_languages') });
    }
    
    if (addressLine2 && (!addressLine2.en || !addressLine2.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('address_line2_required_both_languages') });
    }
    
    if (city && (!city.en || !city.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('city_required_both_languages') });
    }
    
    if (state && (!state.en || !state.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('state_required_both_languages') });
    }
    
    if (country && (!country.en || !country.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('country_required_both_languages') });
    }
    
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    
    address.updatedAt = new Date();
    await address.save();
    
    const language = req.query.lang || 'en';
    const formattedAddress = formatAddress(address, language);
    
    res.status(200).json({ status: 'success', message: getBilingualMessage('address_updated'), data: { address: formattedAddress } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_address') });
  }
};

// DELETE /addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address || address.user.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    await address.deleteOne();
    res.status(200).json({ status: 'success', message: getBilingualMessage('address_deleted') });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_address') });
  }
}; 