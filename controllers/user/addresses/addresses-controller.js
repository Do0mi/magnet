// User Addresses Controller - User Address Management
const Address = require('../../../models/address-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatAddress } = require('../../../utils/response-formatters');

// Helper function to validate customer or business permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer' && req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/user/addresses - Get user addresses (Customer or Business)
exports.getAddresses = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const addresses = await Address.find({ user: req.user.id })
      .populate('user', 'firstname lastname email phone role')
      .sort({ isDefault: -1, createdAt: -1 });
    
    const formattedAddresses = addresses.map(address => formatAddress(address));

    res.status(200).json(createResponse('success', { addresses: formattedAddresses }));

  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_addresses')
    });
  }
};

// GET /api/v1/user/addresses/:id - Get a specific customer's address
exports.getAddressById = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const address = await Address.findOne({
      _id: req.params.id,
      user: req.user.id
    })
      .populate('user', 'firstname lastname email phone role');

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }

    const formattedAddress = formatAddress(address);
    res.status(200).json(createResponse('success', { address: formattedAddress }));

  } catch (error) {
    console.error('Get address by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_address')
    });
  }
};

// POST /api/v1/user/addresses/address - Create a new address
exports.createAddress = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault = false } = req.body;

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

    // Check if this address already exists for the user
    const duplicateAddress = await Address.findOne({
      user: req.user.id,
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2 ? addressLine2.trim() : null,
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode ? postalCode.trim() : null,
      country: country.trim()
    });

    if (duplicateAddress) {
      return res.status(400).json({
        status: 'error',
        message: {
          en: 'This address already exists for your account',
          ar: 'هذا العنوان موجود بالفعل في حسابك'
        }
      });
    }

    // Check if user has any existing addresses
    const existingAddressCount = await Address.countDocuments({ user: req.user.id });
    
    // If this is the first address, automatically set it as default
    const finalIsDefault = existingAddressCount === 0 ? true : isDefault;

    // If this is set as default, unset other default addresses
    if (finalIsDefault) {
      await Address.updateMany(
        { user: req.user.id, isDefault: true },
        { isDefault: false }
      );
    }

    const address = new Address({
      user: req.user.id,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: finalIsDefault
    });

    await address.save();

    // Re-populate to get the user details
    const populatedAddress = await Address.findById(address._id)
      .populate('user', 'firstname lastname email phone role');
    
    const formattedAddress = formatAddress(populatedAddress);

    res.status(201).json(createResponse('success', 
      { address: formattedAddress },
      getBilingualMessage('address_added')
    ));

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_add_address')
    });
  }
};

// PUT /api/v1/user/addresses/:id - Update address (Customer or Business)
exports.updateAddress = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const address = await Address.findById(req.params.id)
      .populate('user', 'firstname lastname email phone role');
    if (!address || address.user._id.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
    
    // Prepare the updated address fields
    const updatedAddressLine1 = addressLine1 ? addressLine1.trim() : address.addressLine1;
    const updatedAddressLine2 = addressLine2 !== undefined ? (addressLine2 ? addressLine2.trim() : null) : address.addressLine2;
    const updatedCity = city ? city.trim() : address.city;
    const updatedState = state ? state.trim() : address.state;
    const updatedPostalCode = postalCode !== undefined ? (postalCode ? postalCode.trim() : null) : address.postalCode;
    const updatedCountry = country ? country.trim() : address.country;

    // Check if the updated address would be a duplicate (excluding current address)
    const duplicateAddress = await Address.findOne({
      user: req.user.id,
      _id: { $ne: req.params.id },
      addressLine1: updatedAddressLine1,
      addressLine2: updatedAddressLine2,
      city: updatedCity,
      state: updatedState,
      postalCode: updatedPostalCode,
      country: updatedCountry
    });

    if (duplicateAddress) {
      return res.status(400).json({
        status: 'error',
        message: {
          en: 'This address already exists for your account',
          ar: 'هذا العنوان موجود بالفعل في حسابك'
        }
      });
    }
    
    if (addressLine1) address.addressLine1 = updatedAddressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = updatedAddressLine2;
    if (city) address.city = updatedCity;
    if (state) address.state = updatedState;
    if (postalCode !== undefined) address.postalCode = updatedPostalCode;
    if (country) address.country = updatedCountry;
    if (isDefault !== undefined) address.isDefault = isDefault;
    
    address.updatedAt = new Date();
    await address.save();

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, isDefault: true, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }
    
    // Re-populate to get the updated user details
    const updatedAddress = await Address.findById(req.params.id)
      .populate('user', 'firstname lastname email phone role');
    
    const formattedAddress = formatAddress(updatedAddress);
    
    res.status(200).json(createResponse('success', 
      { address: formattedAddress },
      getBilingualMessage('address_updated')
    ));

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_address')
    });
  }
};

// DELETE /api/v1/user/addresses/:id - Delete address (Customer or Business)
exports.deleteAddress = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const address = await Address.findById(req.params.id)
      .populate('user', 'firstname lastname email phone role');
    if (!address || address.user._id.toString() !== req.user.id) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    await address.deleteOne();
    res.status(200).json(createResponse('success', null, getBilingualMessage('address_deleted')));

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_address')
    });
  }
};
