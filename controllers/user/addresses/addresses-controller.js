// User Addresses Controller - User Address Management
const Address = require('../../../models/address-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate customer permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/user/addresses - Get user addresses (Customer only)
exports.getAddresses = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const addresses = await Address.find({ user: req.user.id })
      .sort({ isDefault: -1, createdAt: -1 });

    res.status(200).json(createResponse('success', { addresses }));

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
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }

    res.status(200).json(createResponse('success', { address }));

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

    const { street, city, state, postalCode, country, isDefault = false } = req.body;

    // Validate required fields
    if (!street || !city || !country) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, isDefault: true },
        { isDefault: false }
      );
    }

    const address = new Address({
      user: req.user.id,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault
    });

    await address.save();

    res.status(201).json(createResponse('success', {
      address
    }, getBilingualMessage('address_created_success')));

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_address')
    });
  }
};

// PUT /api/v1/user/addresses/:id - Update address (Customer only)
exports.updateAddress = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { street, city, state, postalCode, country, isDefault } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (street) updateFields.street = street;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (postalCode) updateFields.postalCode = postalCode;
    if (country) updateFields.country = country;
    if (isDefault !== undefined) updateFields.isDefault = isDefault;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await Address.updateMany(
        { user: req.user.id, isDefault: true, _id: { $ne: req.params.id } },
        { isDefault: false }
      );
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      address
    }, getBilingualMessage('address_updated_success')));

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_address')
    });
  }
};

// DELETE /api/v1/user/addresses/:id - Delete address (Customer only)
exports.deleteAddress = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!address) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('address_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('address_deleted_success')));

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_address')
    });
  }
};
