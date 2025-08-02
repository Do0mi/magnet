const Address = require('../models/address-model');
const { getBilingualMessage } = require('../utils/messages');

// Helper function to format address data
const formatAddress = (address) => {
  if (!address) return address;
  return address.toObject ? address.toObject() : address;
};

// GET /addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    
    const formattedAddresses = addresses.map(address => formatAddress(address));
    
    res.status(200).json({ status: 'success', data: { addresses: formattedAddresses } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_addresses') });
  }
};

// POST /addresses
exports.addAddress = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    // Validate required fields
    if (!addressLine1) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('address_line1_required') });
    }
    
    if (!city) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('city_required') });
    }
    
    if (!state) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('state_required') });
    }
    
    if (!country) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('country_required') });
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
    
    const formattedAddress = formatAddress(address);
    
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
    
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country) address.country = country;
    
    address.updatedAt = new Date();
    await address.save();
    
    const formattedAddress = formatAddress(address);
    
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