// Dashboard Users Controller - Admin/Employee User Management
const User = require('../../../models/user-model');
const bcrypt = require('bcryptjs');
const { getBilingualMessage } = require('../../../utils/messages');
const { formatUser, createResponse } = require('../../../utils/response-formatters');

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

// Helper function to check if email/phone already exists
const checkExistingUser = async (email, phone) => {
  const existingEmail = email ? await User.findOne({ email }) : null;
  const existingPhone = phone ? await User.findOne({ phone }) : null;
  
  return { existingEmail, existingPhone };
};

// POST /api/v1/dashboard/users/user - Create user
exports.createUser = async (req, res) => {
  try {
    // Validate admin or magnet employee permissions
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { firstname, lastname, email, phone, password, role, country, language = 'en' } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password || !role) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // Check if email/phone already exists
    const { existingEmail, existingPhone } = await checkExistingUser(email, phone);
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('email_already_registered')
      });
    }
    if (existingPhone) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('phone_already_registered')
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role,
      country,
      language,
      isEmailVerified: true,
      isPhoneVerified: true,
      isAllowed: true
    });

    await user.save();

    res.status(201).json(createResponse('success', {
      user: formatUser(user, { includeBusinessInfo: true })
    }, getBilingualMessage('user_created_success')));

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_user')
    });
  }
};

// GET /api/v1/dashboard/users - Get all users
exports.getUsers = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, role, search, isAllowed } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (role) filter.role = role;
    if (isAllowed !== undefined) filter.isAllowed = isAllowed === 'true';
    if (search) {
      filter.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      users: users.map(user => formatUser(user, { includeBusinessInfo: true })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_users')
    });
  }
};

// PUT /api/v1/dashboard/users/user/:id/toggle - Toggle allow user
exports.toggleUser = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isAllowed: !user.isAllowed, updatedAt: Date.now() },
      { new: true }
    ).select('-password');

    res.status(200).json(createResponse('success', {
      user: formatUser(updatedUser, { includeBusinessInfo: true })
    }, getBilingualMessage('user_toggled_success')));

  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_user')
    });
  }
};

// GET /api/v1/dashboard/users/:id - Get user by id
exports.getUserById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { includeBusinessInfo: true })
    }));

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_user')
    });
  }
};

// PUT /api/v1/dashboard/users/user/:id - Update user
exports.updateUser = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { firstname, lastname, email, phone, role, country, language, isAllowed } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (role) updateFields.role = role;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;
    if (isAllowed !== undefined) updateFields.isAllowed = isAllowed;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { includeBusinessInfo: true })
    }, getBilingualMessage('user_updated_success')));

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_user')
    });
  }
};

// DELETE /api/v1/dashboard/users/user/:id - Delete user
exports.deleteUser = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('user_deleted_success')));

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_user')
    });
  }
};
