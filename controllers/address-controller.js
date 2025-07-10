const Address = require('../models/address-model');

// GET /addresses
exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    res.status(200).json({ status: 'success', data: { addresses } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get addresses' });
  }
};

// POST /addresses
exports.addAddress = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
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
    res.status(201).json({ status: 'success', message: 'Address added', data: { address } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add address' });
  }
};

// PUT /addresses/:id
exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address || address.user.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Address not found' });
    }
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    address.updatedAt = new Date();
    await address.save();
    res.status(200).json({ status: 'success', message: 'Address updated', data: { address } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update address' });
  }
};

// DELETE /addresses/:id
exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findById(req.params.id);
    if (!address || address.user.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: 'Address not found' });
    }
    await address.deleteOne();
    res.status(200).json({ status: 'success', message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to delete address' });
  }
}; 