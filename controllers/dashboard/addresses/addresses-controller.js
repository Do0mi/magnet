// Dashboard Addresses Controller - Admin/Employee Address Management
const Address = require('../../../models/address-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate admin or magnet employee permissions
const validateAdminOrEmployeePermissions = (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/dashboard/addresses - Get all addresses
exports.getAddresses = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, search, country, city } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (country) filter.country = country;
    if (city) filter.city = { $regex: city, $options: 'i' };
    if (search) {
      filter.$or = [
        { street: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { state: { $regex: search, $options: 'i' } },
        { postalCode: { $regex: search, $options: 'i' } },
        { 'user.firstname': { $regex: search, $options: 'i' } },
        { 'user.lastname': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } }
      ];
    }

    const addresses = await Address.find(filter)
      .populate('user', 'firstname lastname email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Address.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      addresses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalAddresses: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get all addresses error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_addresses')
    });
  }
};

// GET /api/v1/dashboard/addresses/:id - Get address by id
exports.getAddressById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const address = await Address.findById(req.params.id)
      .populate('user', 'firstname lastname email phone');

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

// POST /api/v1/dashboard/addresses/address - Create an address to a specific user
exports.createAddress = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { userId, street, city, state, postalCode, country, isDefault = false } = req.body;

    // Validate required fields
    if (!userId || !street || !city || !country) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    // If this is set as default, unset other default addresses for this user
    if (isDefault) {
      await Address.updateMany(
        { user: userId, isDefault: true },
        { isDefault: false }
      );
    }

    const address = new Address({
      user: userId,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault
    });

    await address.save();

    await address.populate('user', 'firstname lastname email phone');

    res.status(201).json(createResponse('success', {
      address
    }, getBilingualMessage('address_created_success')));

  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_address')
    });
  }
};

// PUT /api/v1/dashboard/addresses/address/:id - Update an address to a specific user
exports.updateAddress = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { street, city, state, postalCode, country, isDefault } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (street) updateFields.street = street;
    if (city) updateFields.city = city;
    if (state) updateFields.state = state;
    if (postalCode) updateFields.postalCode = postalCode;
    if (country) updateFields.country = country;
    if (isDefault !== undefined) updateFields.isDefault = isDefault;

    // If this is set as default, unset other default addresses for this user
    if (isDefault) {
      const address = await Address.findById(req.params.id);
      if (address) {
        await Address.updateMany(
          { user: address.user, isDefault: true, _id: { $ne: req.params.id } },
          { isDefault: false }
        );
      }
    }

    const address = await Address.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('user', 'firstname lastname email phone');

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

// DELETE /api/v1/dashboard/addresses/address/:id - Delete an address to a specific user
exports.deleteAddress = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const address = await Address.findByIdAndDelete(req.params.id);

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
