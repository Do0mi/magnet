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
      streetName,
      // Access pages for admin/employee
      accessPages
    } = req.body;

    // Validate required fields
    if (!firstname || !lastname || !email || !password || !role) {
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

    // Validate business fields if creating business user
    if (role === 'business') {
      if (!crNumber || !vatNumber || !companyName || !companyType || !city || !district || !streetName) {
        return res.status(400).json({ 
          status: 'error', 
          message: getBilingualMessage('business_fields_required') 
        });
      }
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

    // Prepare user data
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
      isPhoneVerified: true,
      isAllowed: true
    };

    // Add business info if role is business
    if (role === 'business') {
      userData.businessInfo = {
        crNumber,
        vatNumber,
        companyName,
        companyType,
        address: {
          city,
          district,
          streetName
        },
        approvalStatus: 'approved', // Auto-approve when created by admin
        approvedBy: req.user._id,
        approvedAt: new Date()
      };
    }

    // Add access pages if role is admin or employee
    if (role === 'admin' || role === 'magnet_employee') {
      if (accessPages && typeof accessPages === 'object') {
        userData.accessPages = {
          dashboard: accessPages.dashboard || false,
          analytics: accessPages.analytics || false,
          users: accessPages.users || false,
          products: accessPages.products || false,
          orders: accessPages.orders || false,
          reviews: accessPages.reviews || false,
          wishlists: accessPages.wishlists || false,
          categories: accessPages.categories || false,
          addresses: accessPages.addresses || false
        };
      }
    }

    // Create user
    const user = new User(userData);

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
        { phone: { $regex: search, $options: 'i' } },
        { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: search, options: 'i' } } }
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

    const { disallowReason } = req.body || {};
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    // Check if user is being disallowed
    const isBeingDisallowed = !user.isAllowed;
    
    // If user is being disallowed, disallowReason is required
    if (isBeingDisallowed && !disallowReason) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('disallow_reason_required')
      });
    }

    // Prepare update fields
    const updateFields = { 
      isAllowed: !user.isAllowed, 
      updatedAt: Date.now() 
    };

    if (isBeingDisallowed) {
      // User is being disallowed - set disallow fields
      updateFields.disallowReason = disallowReason;
      updateFields.disallowedBy = req.user._id;
      updateFields.disallowedAt = new Date();
    } else {
      // User is being allowed - clear disallow fields
      updateFields.disallowReason = null;
      updateFields.disallowedBy = null;
      updateFields.disallowedAt = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select('-password');

    // Send appropriate email notification based on the NEW status
    try {
      if (updatedUser.isAllowed) {
        // User is now allowed - send allow notification
        const { sendUserAllowNotification } = require('../../../utils/email-utils');
        await sendUserAllowNotification(
          user.email,
          `${user.firstname} ${user.lastname}`
        );
      } else {
        // User is now disallowed - send disallow notification
        const { sendUserDisallowNotification } = require('../../../utils/email-utils');
        await sendUserDisallowNotification(
          user.email,
          `${user.firstname} ${user.lastname}`,
          disallowReason
        );
      }
    } catch (emailError) {
      console.error('Email notification error:', emailError);
      // Don't fail the request if email fails
    }

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

    const { 
      // Basic user fields
      firstname, 
      lastname, 
      email, 
      phone, 
      role, 
      country, 
      language, 
      imageUrl,
      isAllowed,
      isEmailVerified,
      isPhoneVerified,
      // Business specific fields
      crNumber,
      vatNumber,
      companyName,
      companyType,
      city,
      district,
      streetName,
      approvalStatus,
      rejectionReason,
      // Access pages for admin/employee
      accessPages,
      // Disallow fields for customers
      disallowReason
    } = req.body;

    const updateFields = { updatedAt: Date.now() };

    // Update basic user fields
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (email) updateFields.email = email;
    if (phone) updateFields.phone = phone;
    if (role) updateFields.role = role;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;
    if (isAllowed !== undefined) updateFields.isAllowed = isAllowed;
    if (isEmailVerified !== undefined) updateFields.isEmailVerified = isEmailVerified;
    if (isPhoneVerified !== undefined) updateFields.isPhoneVerified = isPhoneVerified;

    // Get the current user to check their role
    const currentUser = await User.findById(req.params.id);
    if (!currentUser) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('user_not_found')
      });
    }

    // Handle business info updates
    if (currentUser.role === 'business' || role === 'business') {
      const businessInfoUpdate = {};
      
      if (crNumber !== undefined) businessInfoUpdate.crNumber = crNumber;
      if (vatNumber !== undefined) businessInfoUpdate.vatNumber = vatNumber;
      if (companyName !== undefined) businessInfoUpdate.companyName = companyName;
      if (companyType !== undefined) businessInfoUpdate.companyType = companyType;
      if (approvalStatus !== undefined) businessInfoUpdate.approvalStatus = approvalStatus;
      if (rejectionReason !== undefined) businessInfoUpdate.rejectionReason = rejectionReason;

      // Handle address updates
      if (city !== undefined || district !== undefined || streetName !== undefined) {
        businessInfoUpdate.address = {
          city: city !== undefined ? city : (currentUser.businessInfo?.address?.city || null),
          district: district !== undefined ? district : (currentUser.businessInfo?.address?.district || null),
          streetName: streetName !== undefined ? streetName : (currentUser.businessInfo?.address?.streetName || null)
        };
      }

      // Handle approval/rejection tracking
      if (approvalStatus === 'approved') {
        businessInfoUpdate.approvedBy = req.user._id;
        businessInfoUpdate.approvedAt = new Date();
        businessInfoUpdate.rejectedBy = undefined;
        businessInfoUpdate.rejectedAt = undefined;
        businessInfoUpdate.rejectionReason = undefined;
      } else if (approvalStatus === 'rejected') {
        businessInfoUpdate.rejectedBy = req.user._id;
        businessInfoUpdate.rejectedAt = new Date();
        businessInfoUpdate.approvedBy = undefined;
        businessInfoUpdate.approvedAt = undefined;
      }

      if (Object.keys(businessInfoUpdate).length > 0) {
        updateFields.businessInfo = businessInfoUpdate;
      }
    }

    // Handle access pages for admin/employee roles
    if ((currentUser.role === 'admin' || currentUser.role === 'magnet_employee' || role === 'admin' || role === 'magnet_employee') && accessPages) {
      if (typeof accessPages === 'object') {
        updateFields.accessPages = {
          dashboard: accessPages.dashboard !== undefined ? accessPages.dashboard : (currentUser.accessPages?.dashboard || false),
          analytics: accessPages.analytics !== undefined ? accessPages.analytics : (currentUser.accessPages?.analytics || false),
          users: accessPages.users !== undefined ? accessPages.users : (currentUser.accessPages?.users || false),
          products: accessPages.products !== undefined ? accessPages.products : (currentUser.accessPages?.products || false),
          orders: accessPages.orders !== undefined ? accessPages.orders : (currentUser.accessPages?.orders || false),
          reviews: accessPages.reviews !== undefined ? accessPages.reviews : (currentUser.accessPages?.reviews || false),
          wishlists: accessPages.wishlists !== undefined ? accessPages.wishlists : (currentUser.accessPages?.wishlists || false),
          categories: accessPages.categories !== undefined ? accessPages.categories : (currentUser.accessPages?.categories || false),
          addresses: accessPages.addresses !== undefined ? accessPages.addresses : (currentUser.accessPages?.addresses || false)
        };
      }
    }

    // Handle disallow fields for customer users
    if ((currentUser.role === 'customer' || role === 'customer') && disallowReason !== undefined) {
      if (disallowReason) {
        updateFields.disallowReason = disallowReason;
        updateFields.disallowedBy = req.user._id;
        updateFields.disallowedAt = new Date();
      } else {
        updateFields.disallowReason = undefined;
        updateFields.disallowedBy = undefined;
        updateFields.disallowedAt = undefined;
      }
    }

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
