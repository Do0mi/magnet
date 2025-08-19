// Admin Controller - User Management
const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const { getBilingualMessage } = require('../utils/messages');
const { formatUser, createResponse } = require('../utils/response-formatters');

// Helper function to validate admin permissions
const validateAdminPermissions = (req, res) => {
  if (req.user.role !== 'admin') {
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

// POST /admin/users - Create any type of user
exports.createUser = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { 
      firstname, 
      lastname, 
      email, 
      phone, 
      password, 
      role, 
      country, 
      language = 'en',
      // Business specific fields
      crNumber,
      vatNumber,
      companyName,
      companyType,
      city,
      district,
      streetName
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password || !role || !country) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('missing_required_fields') 
      });
    }

    // Validate role
    const validRoles = ['admin', 'magnet_employee', 'business', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('invalid_role') 
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

    // Validate business fields if creating business user
    if (role === 'business') {
      if (!crNumber || !vatNumber || !companyName || !companyType || !city || !district || !streetName) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('business_fields_required') 
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object
    const userData = {
      firstname,
      lastname,
      email,
      phone,
      password: hashedPassword,
      role,
      country,
      language,
      isEmailVerified: true,
      isPhoneVerified: phone ? true : false,
      isDisallowed: false
    };

    // Add business info if creating business user
    if (role === 'business') {
      userData.businessInfo = {
        crNumber,
        vatNumber,
        companyName,
        companyType,
        city,
        district,
        streetName,
        isApproved: true,
        approvalStatus: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      };
    }

    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json(createResponse('success', {
      user: formatUser(newUser, { 
        includeBusinessInfo: role === 'business',
        includeVerification: true 
      })
    }, getBilingualMessage('user_created_successfully')));

  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_create_user') 
    });
  }
};

// GET /admin/users - Get all users with pagination and filters
exports.getAllUsers = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'disallowed') {
      query.isDisallowed = true;
    } else if (status === 'active') {
      query.isDisallowed = false;
    }
    
    if (search) {
      query.$or = [
        { firstname: { $regex: search, $options: 'i' } },
        { lastname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'businessInfo.companyName': { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select('-password -emailOTP -phoneOTP -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    const formattedUsers = users.map(user => formatUser(user, { 
      includeBusinessInfo: true,
      includeVerification: true 
    }));

    res.status(200).json(createResponse('success', {
      users: formattedUsers
    }, null, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }));

  } catch (err) {
    console.error('Get all users error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_users') 
    });
  }
};

// GET /admin/users/:id - Get specific user
exports.getUserById = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;
    const user = await User.findById(id).select('-password -emailOTP -phoneOTP -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }));

  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_user') 
    });
  }
};

// PUT /admin/users/:id - Update user
exports.updateUser = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;
    const {
      firstname,
      lastname,
      email,
      phone,
      password,
      role,
      country,
      language,
      isEmailVerified,
      isPhoneVerified,
      isDisallowed,
      // Business specific fields
      crNumber,
      vatNumber,
      companyName,
      companyType,
      businessCity,
      businessDistrict,
      businessStreetName
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    // Check if email/phone already exists (excluding current user)
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: id } });
      if (existingEmail) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('email_already_registered') 
        });
      }
    }

    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: id } });
      if (existingPhone) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('phone_already_registered') 
        });
      }
    }

    // Update basic fields
    if (firstname) user.firstname = firstname;
    if (lastname) user.lastname = lastname;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (country) user.country = country;
    if (language) user.language = language;
    if (typeof isEmailVerified === 'boolean') user.isEmailVerified = isEmailVerified;
    if (typeof isPhoneVerified === 'boolean') user.isPhoneVerified = isPhoneVerified;
    if (typeof isDisallowed === 'boolean') user.isDisallowed = isDisallowed;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Update business info if provided
    if (user.role === 'business' && user.businessInfo) {
      if (crNumber) user.businessInfo.crNumber = crNumber;
      if (vatNumber) user.businessInfo.vatNumber = vatNumber;
      if (companyName) user.businessInfo.companyName = companyName;
      if (companyType) user.businessInfo.companyType = companyType;
      if (businessCity) user.businessInfo.city = businessCity;
      if (businessDistrict) user.businessInfo.district = businessDistrict;
      if (businessStreetName) user.businessInfo.streetName = businessStreetName;
    }

    user.updatedAt = new Date();
    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('user_updated_successfully')));

  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_update_user') 
    });
  }
};

// DELETE /admin/users/:id - Delete user
exports.deleteUser = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('cannot_delete_self') 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    await user.deleteOne();

    res.status(200).json(createResponse('success', null, getBilingualMessage('user_deleted_successfully')));

  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_delete_user') 
    });
  }
};

// PUT /admin/users/:id/disallow - Disallow user
exports.disallowUser = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;
    const { reason } = req.body;

    // Prevent admin from disallowing themselves
    if (id === req.user.id) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('cannot_disallow_self') 
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    user.isDisallowed = true;
    user.disallowReason = reason;
    user.disallowedBy = req.user.id;
    user.disallowedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('user_disallowed_successfully')));

  } catch (err) {
    console.error('Disallow user error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_disallow_user') 
    });
  }
};

// PUT /admin/users/:id/allow - Allow user
exports.allowUser = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    user.isDisallowed = false;
    user.disallowReason = undefined;
    user.disallowedBy = undefined;
    user.disallowedAt = undefined;
    user.allowedBy = req.user.id;
    user.allowedAt = new Date();
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('user_allowed_successfully')));

  } catch (err) {
    console.error('Allow user error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_allow_user') 
    });
  }
};

// GET /admin/users/stats - Get user statistics
exports.getUserStats = async (req, res) => {
  try {
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;

    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalBusinesses = await User.countDocuments({ role: 'business' });
    const totalEmployees = await User.countDocuments({ role: 'magnet_employee' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const disallowedUsers = await User.countDocuments({ isDisallowed: true });
    const activeUsers = await User.countDocuments({ isDisallowed: false });

    // Business approval stats
    const pendingBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'pending' 
    });
    const approvedBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'approved' 
    });
    const rejectedBusinesses = await User.countDocuments({ 
      role: 'business', 
      'businessInfo.approvalStatus': 'rejected' 
    });

    res.status(200).json(createResponse('success', {
      stats: {
        total: totalUsers,
        byRole: {
          customers: totalCustomers,
          businesses: totalBusinesses,
          employees: totalEmployees,
          admins: totalAdmins
        },
        byStatus: {
          active: activeUsers,
          disallowed: disallowedUsers
        },
        businessApproval: {
          pending: pendingBusinesses,
          approved: approvedBusinesses,
          rejected: rejectedBusinesses
        }
      }
    }));

  } catch (err) {
    console.error('Get user stats error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_user_stats') 
    });
  }
};
