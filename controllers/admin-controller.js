// Admin Controller - User Management
const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const { getBilingualMessage } = require('../utils/messages');
const { formatUser, createResponse } = require('../utils/response-formatters');
const Wishlist = require('../models/wishlist-model');
const Review = require('../models/review-model');
const Address = require('../models/address-model');
const Order = require('../models/order-model');
const Product = require('../models/product-model');

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
      imageUrl,
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
      imageUrl,
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

    // Populate the approvedBy field if it's a business user
    if (role === 'business') {
      await newUser.populate('businessInfo.approvedBy', 'firstname lastname email role');
    }

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
    } else if (status === 'allowed') {
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
      .populate('businessInfo.approvedBy', 'firstname lastname email role')
      .select('-password -emailOTP -phoneOTP -passwordResetToken')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    // Auto-fix approvedBy field for business users that are approved but have null approvedBy
    const businessUsersToFix = users.filter(user => 
      user.role === 'business' && 
      user.businessInfo?.isApproved === true && 
      user.businessInfo?.approvalStatus === 'approved' && 
      !user.businessInfo?.approvedBy
    );

    if (businessUsersToFix.length > 0) {
      // Get the first admin user to set as the approver
      const adminUser = await User.findOne({ role: 'admin' }).select('_id firstname lastname email');
      
      if (adminUser) {
        // Update all business users that need fixing
        const userIdsToFix = businessUsersToFix.map(user => user._id);
        await User.updateMany(
          { _id: { $in: userIdsToFix } },
          { $set: { 'businessInfo.approvedBy': adminUser._id } }
        );

        // Re-populate the approvedBy field for the fixed users
        for (let user of businessUsersToFix) {
          user.businessInfo.approvedBy = {
            _id: adminUser._id,
            firstname: adminUser.firstname,
            lastname: adminUser.lastname,
            email: adminUser.email,
            role: 'admin'
          };
        }
      }
    }

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
    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role')
      .select('-password -emailOTP -phoneOTP -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    // Auto-fix approvedBy field for business user if needed
    if (user.role === 'business' && 
        user.businessInfo?.isApproved === true && 
        user.businessInfo?.approvalStatus === 'approved' && 
        !user.businessInfo?.approvedBy) {
      
      // Get the first admin user to set as the approver
      const adminUser = await User.findOne({ role: 'admin' }).select('_id firstname lastname email');
      
      if (adminUser) {
        // Update the business user's approvedBy field
        await User.updateOne(
          { _id: id },
          { $set: { 'businessInfo.approvedBy': adminUser._id } }
        );

        // Update the current user object for the response
        user.businessInfo.approvedBy = {
          _id: adminUser._id,
          firstname: adminUser.firstname,
          lastname: adminUser.lastname,
          email: adminUser.email,
          role: 'admin'
        };
      }
    }

    let additionalData = {};

    // Get role-specific data
    if (user.role === 'business') {
      // For business users: get products and their reviews
      const products = await Product.find({ owner: id })
        .populate('category', 'name')
        .populate('approvedBy', 'firstname lastname email role')
        .select('-__v');

      // Get reviews for all products of this business
      const productIds = products.map(product => product._id);
      const reviews = await Review.find({ product: { $in: productIds } })
        .populate('user', 'firstname lastname email role')
        .populate('product', 'name code')
        .select('-__v');

      additionalData = {
        products: products.map(product => ({
          id: product._id,
          name: product.name,
          code: product.code,
          status: product.status,
          category: product.category,
          price: product.price,
          description: product.description,
          imageUrl: product.images && product.images.length > 0 ? product.images[0] : null,
          approvedBy: product.approvedBy,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        })),
        reviews: reviews.map(review => ({
          id: review._id,
          user: review.user,
          product: {
            id: review.product._id,
            name: review.product.name,
            code: review.product.code,
            imageUrl: review.product.images && review.product.images.length > 0 ? review.product.images[0] : null
          },
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt
        }))
      };
    } else if (user.role === 'customer') {
      // For customer users: get orders, wishlist, addresses and reviews
      const orders = await Order.find({ customer: id })
        .populate('shippingAddress')
        .populate({
          path: 'items.product',
          select: 'name code status category pricePerUnit images'
        })
        .select('-__v')
        .sort({ createdAt: -1 });

      const wishlist = await Wishlist.findOne({ user: id })
        .populate('products', 'name code status category images')
        .select('-__v');

      const addresses = await Address.find({ user: id })
        .select('-__v')
        .sort({ createdAt: -1 });

      const reviews = await Review.find({ user: id })
        .populate('product', 'name code status category images')
        .select('-__v')
        .sort({ createdAt: -1 });

      const { formatOrder } = require('../utils/response-formatters');
      
      additionalData = {
        orders: orders.map(order => formatOrder(order, { 
          language: 'en', // Default to English for admin view, could be made configurable
          includeItems: true,
          includeCustomer: false, // We already know the customer
          includeAddress: true,
          includeStatusLog: true,
          includeTotal: true
        })),
        wishlist: wishlist ? {
          id: wishlist._id,
          products: wishlist.products.map(product => ({
            id: product._id,
            name: product.name,
            code: product.code,
            status: product.status,
            category: product.category,
            imageUrl: product.images && product.images.length > 0 ? product.images[0] : null
          })),
          createdAt: wishlist.createdAt
        } : null,
        addresses: addresses.map(address => ({
          id: address._id,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
          createdAt: address.createdAt,
          updatedAt: address.updatedAt
        })),
        reviews: reviews.map(review => ({
          id: review._id,
          product: {
            id: review.product._id,
            name: review.product.name,
            code: review.product.code,
            status: review.product.status,
            category: review.product.category,
            imageUrl: review.product.images && review.product.images.length > 0 ? review.product.images[0] : null
          },
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt
        }))
      };
    } else if (user.role === 'admin' || user.role === 'magnet_employee') {
      // For admin/magnet_employee users: get products they approved/declined, reviews they rejected, and orders they updated
      
      // Get products approved/declined by this admin/employee
      const moderatedProducts = await Product.find({ approvedBy: id })
        .populate('owner', 'firstname lastname email role businessInfo.companyName')
        .populate('category', 'name')
        .select('-__v')
        .sort({ updatedAt: -1 });

      // Get reviews rejected by this admin/employee
      const rejectedReviews = await Review.find({ rejectedBy: id })
        .populate('user', 'firstname lastname email role')
        .populate('product', 'name code status category images')
        .select('-__v')
        .sort({ rejectedAt: -1 });

      // Get orders that this admin/employee has updated (confirmed, shipped, cancelled)
      const moderatedOrders = await Order.find({
        'statusLog.updatedBy': id
      })
        .populate('customer', 'firstname lastname email role')
        .populate({
          path: 'items.product',
          select: 'name code status category pricePerUnit images'
        })
        .populate('statusLog.updatedBy', 'firstname lastname email role')
        .select('-__v')
        .sort({ updatedAt: -1 });

      // Get business users approved by this admin/employee
      const approvedBusinessUsers = await User.find({
        role: 'business',
        'businessInfo.approvedBy': id,
        'businessInfo.isApproved': true
      })
        .select('firstname lastname email phone role country language imageUrl createdAt updatedAt businessInfo')
        .sort({ 'businessInfo.approvedAt': -1 });

      additionalData = {
        moderatedProducts: moderatedProducts.map(product => ({
          id: product._id,
          name: product.name,
          code: product.code,
          status: product.status,
          category: product.category,
          price: product.price,
          description: product.description,
          imageUrl: product.images && product.images.length > 0 ? product.images[0] : null,
          owner: product.owner,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        })),
        rejectedReviews: rejectedReviews.map(review => ({
          id: review._id,
          user: review.user,
          product: {
            id: review.product._id,
            name: review.product.name,
            code: review.product.code,
            status: review.product.status,
            category: review.product.category,
            imageUrl: review.product.images && review.product.images.length > 0 ? review.product.images[0] : null
          },
          rating: review.rating,
          comment: review.comment,
          status: review.status,
          rejectedAt: review.rejectedAt,
          rejectionReason: review.rejectionReason,
          createdAt: review.createdAt
        })),
        moderatedOrders: moderatedOrders.map(order => formatOrder(order, { 
          language: 'en', // Default to English for admin view, could be made configurable
          includeItems: true,
          includeCustomer: true,
          includeAddress: true,
          includeStatusLog: true,
          includeTotal: true
        })),
        approvedBusinessUsers: approvedBusinessUsers.map(businessUser => ({
          id: businessUser._id,
          firstname: businessUser.firstname,
          lastname: businessUser.lastname,
          email: businessUser.email,
          phone: businessUser.phone,
          role: businessUser.role,
          country: businessUser.country,
          language: businessUser.language,
          imageUrl: businessUser.imageUrl,
          createdAt: businessUser.createdAt,
          updatedAt: businessUser.updatedAt,
          businessInfo: {
            crNumber: businessUser.businessInfo.crNumber,
            vatNumber: businessUser.businessInfo.vatNumber,
            companyName: businessUser.businessInfo.companyName,
            companyType: businessUser.businessInfo.companyType,
            city: businessUser.businessInfo.city,
            district: businessUser.businessInfo.district,
            streetName: businessUser.businessInfo.streetName,
            isApproved: businessUser.businessInfo.isApproved,
            approvalStatus: businessUser.businessInfo.approvalStatus,
            approvedBy: businessUser.businessInfo.approvedBy,
            approvedAt: businessUser.businessInfo.approvedAt
          }
        }))
      };
    }

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      }),
      ...additionalData
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
      imageUrl,
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

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
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
    if (imageUrl !== undefined) user.imageUrl = imageUrl; // Allow setting to null/empty string
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

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
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

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
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

// ========================================
// ADMIN VERIFICATION MANAGEMENT
// ========================================

// PUT /admin/users/:id/verify-email - Verify user email
exports.verifyUserEmail = async (req, res) => {
  try {
    // Validate admin or magnet employee permissions
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('email_already_verified') 
      });
    }

    user.isEmailVerified = true;
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('email_verified_successfully')));

  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_verify_email') 
    });
  }
};

// PUT /admin/users/:id/unverify-email - Unverify user email
exports.unverifyUserEmail = async (req, res) => {
  try {
    // Validate admin or magnet employee permissions
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    if (!user.isEmailVerified) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('email_not_verified') 
      });
    }

    user.isEmailVerified = false;
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('email_unverified_successfully')));

  } catch (err) {
    console.error('Unverify email error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_unverify_email') 
    });
  }
};

// PUT /admin/users/:id/verify-phone - Verify user phone
exports.verifyUserPhone = async (req, res) => {
  try {
    // Validate admin or magnet employee permissions
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    if (!user.phone) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('user_has_no_phone') 
      });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('phone_already_verified') 
      });
    }

    user.isPhoneVerified = true;
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('phone_verified_successfully')));

  } catch (err) {
    console.error('Verify phone error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_verify_phone') 
    });
  }
};

// PUT /admin/users/:id/unverify-phone - Unverify user phone
exports.unverifyUserPhone = async (req, res) => {
  try {
    // Validate admin or magnet employee permissions
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const user = await User.findById(id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    if (!user.isPhoneVerified) {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('phone_not_verified') 
      });
    }

    user.isPhoneVerified = false;
    user.updatedAt = new Date();

    await user.save();

    res.status(200).json(createResponse('success', {
      user: formatUser(user, { 
        includeBusinessInfo: true,
        includeVerification: true 
      })
    }, getBilingualMessage('phone_unverified_successfully')));

  } catch (err) {
    console.error('Unverify phone error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_unverify_phone') 
    });
  }
};



// ========================================
// ADMIN WISHLIST MANAGEMENT
// ========================================

exports.getAllWishlists = async (req, res) => {
  try {
    const { page = 1, limit = 10, userId, productId } = req.query;
    const query = {};
    
    if (userId) query.user = userId;
    if (productId) {
      // For product filtering, we need to check if the product exists in the products array
      query.products = productId;
    }
    
    const skip = (page - 1) * limit;
    const wishlists = await Wishlist.find(query)
      .populate('user', 'firstname lastname email role')
      .populate('products', 'name code status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Wishlist.countDocuments(query);
    
    res.status(200).json(createResponse('success', {
      wishlists: wishlists.map(wishlist => ({
        id: wishlist._id,
        user: wishlist.user,
        products: wishlist.products,
        createdAt: wishlist.createdAt
      }))
    }, null, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }));
  } catch (err) {
    console.error('Get all wishlists error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_wishlists') });
  }
};

exports.getWishlistById = async (req, res) => {
  try {
    const { id } = req.params;
    const wishlist = await Wishlist.findById(id)
      .populate('user', 'firstname lastname email role')
      .populate('products', 'name code status category');
    
    if (!wishlist) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('wishlist_not_found') });
    }
    
    res.status(200).json(createResponse('success', {
      wishlist: {
        id: wishlist._id,
        user: wishlist.user,
        products: wishlist.products,
        createdAt: wishlist.createdAt
      }
    }));
  } catch (err) {
    console.error('Get wishlist by ID error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_wishlist') });
  }
};

exports.createWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;
    
    if (!userId || !productId) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('missing_required_fields') });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    
    // Check if product exists and is approved
    const product = await Product.findById(productId).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    if (!product) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    }
    
    if (product.status !== 'approved') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_not_approved') });
    }
    
    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ user: userId });
    
    if (!wishlist) {
      // Create new wishlist for user
      wishlist = new Wishlist({
        user: userId,
        products: [productId]
      });
    } else {
      // Check if product already exists in wishlist
      if (wishlist.products.includes(productId)) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('product_already_in_wishlist') });
      }
      // Add product to existing wishlist
      wishlist.products.push(productId);
    }
    
    await wishlist.save();
    
    const populatedWishlist = await Wishlist.findById(wishlist._id)
      .populate('user', 'firstname lastname email role')
      .populate('products', 'name code status');
    
    res.status(201).json(createResponse('success', {
      wishlist: {
        id: populatedWishlist._id,
        user: populatedWishlist.user,
        products: populatedWishlist.products,
        createdAt: populatedWishlist.createdAt
      }
    }, getBilingualMessage('wishlist_created_successfully')));
  } catch (err) {
    console.error('Create wishlist error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_wishlist') });
  }
};

exports.updateWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, productId, action } = req.body; // action: 'add' or 'remove'
    
    const wishlist = await Wishlist.findById(id);
    if (!wishlist) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('wishlist_not_found') });
    }
    
    // Validate user if provided
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
      }
      wishlist.user = userId;
    }
    
    // Handle product operations if provided
    if (productId && action) {
      const product = await Product.findById(productId).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
      if (!product) {
        return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
      }
      if (product.status !== 'approved') {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('product_not_approved') });
      }
      
      if (action === 'add') {
        if (wishlist.products.includes(productId)) {
          return res.status(400).json({ status: 'error', message: getBilingualMessage('product_already_in_wishlist') });
        }
        wishlist.products.push(productId);
      } else if (action === 'remove') {
        wishlist.products = wishlist.products.filter(pid => pid.toString() !== productId);
      } else {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_action') });
      }
    }
    
    await wishlist.save();
    
    const updatedWishlist = await Wishlist.findById(id)
      .populate('user', 'firstname lastname email role')
      .populate('products', 'name code status');
    
    res.status(200).json(createResponse('success', {
      wishlist: {
        id: updatedWishlist._id,
        user: updatedWishlist.user,
        products: updatedWishlist.products,
        createdAt: updatedWishlist.createdAt
      }
    }, getBilingualMessage('wishlist_updated_successfully')));
  } catch (err) {
    console.error('Update wishlist error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_wishlist') });
  }
};

exports.deleteWishlist = async (req, res) => {
  try {
    const { id } = req.params;
    const wishlist = await Wishlist.findById(id);
    
    if (!wishlist) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('wishlist_not_found') });
    }
    
    await Wishlist.findByIdAndDelete(id);
    
    res.status(200).json(createResponse('success', null, getBilingualMessage('wishlist_deleted_successfully')));
  } catch (err) {
    console.error('Delete wishlist error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_wishlist') });
  }
};

// ========================================
// ADMIN REVIEW MANAGEMENT
// ========================================

exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10, userName, productName, rating } = req.query;
    const query = {};
    
    // Handle username search
    if (userName && userName.trim()) {
      const searchTerm = userName.trim();
      // Create search patterns for better matching
      const searchPatterns = [
        searchTerm, // Exact match
        `.*${searchTerm}.*`, // Contains anywhere
        `^${searchTerm}.*`, // Starts with
        `.*${searchTerm}$` // Ends with
      ];
      
      const userFilter = {
        $or: [
          // Search in firstname with multiple patterns
          ...searchPatterns.map(pattern => ({ firstname: { $regex: pattern, $options: 'i' } })),
          // Search in lastname with multiple patterns
          ...searchPatterns.map(pattern => ({ lastname: { $regex: pattern, $options: 'i' } })),
          // Search in email
          { email: { $regex: searchTerm, $options: 'i' } },
          // Search in full name (concatenated)
          { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: searchTerm, options: 'i' } } }
        ]
      };
      
      const users = await User.find(userFilter).select('_id');
      const userIds = users.map(user => user._id);
      query.user = { $in: userIds };
    }
    
    // Handle product name search
    if (productName && productName.trim()) {
      const searchTerm = productName.trim();
      // Create search patterns for better matching
      const searchPatterns = [
        searchTerm, // Exact match
        `.*${searchTerm}.*`, // Contains anywhere
        `^${searchTerm}.*`, // Starts with
        `.*${searchTerm}$` // Ends with
      ];
      
      const productFilter = {
        $or: [
          // Search in English name with multiple patterns
          ...searchPatterns.map(pattern => ({ 'name.en': { $regex: pattern, $options: 'i' } })),
          // Search in Arabic name with multiple patterns
          ...searchPatterns.map(pattern => ({ 'name.ar': { $regex: pattern, $options: 'i' } }))
        ]
      };
      
      const products = await Product.find(productFilter).select('_id');
      const productIds = products.map(product => product._id);
      query.product = { $in: productIds };
    }
    
    if (rating) query.rating = parseInt(rating);
    
    const skip = (page - 1) * limit;
    const reviews = await Review.find(query)
      .populate('user', 'firstname lastname email role')
      .populate('product')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Review.countDocuments(query);
    
    res.status(200).json(createResponse('success', {
      reviews: reviews.map(review => ({
        id: review._id,
        user: review.user,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        rejectedBy: review.rejectedBy,
        rejectedAt: review.rejectedAt,
        rejectionReason: review.rejectionReason,
        createdAt: review.createdAt
      }))
    }, null, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }));
  } catch (err) {
    console.error('Get all reviews error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_reviews') });
  }
};

exports.getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id)
      .populate('user', 'firstname lastname email role')
      .populate('product');
    
    if (!review) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    }
    
    res.status(200).json(createResponse('success', {
      review: {
        id: review._id,
        user: review.user,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        rejectedBy: review.rejectedBy,
        rejectedAt: review.rejectedAt,
        rejectionReason: review.rejectionReason,
        createdAt: review.createdAt
      }
    }));
  } catch (err) {
    console.error('Get review by ID error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_review') });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { userId, productId, rating, comment } = req.body;
    
    if (!userId || !productId || !rating) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('missing_required_fields') });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_rating') });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    
    // Check if product exists and is approved
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    }
    
    if (product.status !== 'approved') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_not_approved') });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('already_reviewed_product') });
    }
    
    const review = new Review({
      user: userId,
      product: productId,
      rating,
      comment,
      status: 'accept' // Admin-created reviews are accepted by default
    });
    
    await review.save();
    
    const populatedReview = await Review.findById(review._id)
      .populate('user', 'firstname lastname email role')
      .populate('product');
    
    res.status(201).json(createResponse('success', {
      review: {
        id: populatedReview._id,
        user: populatedReview.user,
        product: populatedReview.product,
        rating: populatedReview.rating,
        comment: populatedReview.comment,
        status: populatedReview.status,
        createdAt: populatedReview.createdAt
      }
    }, getBilingualMessage('review_created_successfully')));
  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_review') });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    }
    
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_rating') });
      }
      review.rating = rating;
    }
    
    if (comment !== undefined) {
      review.comment = comment;
    }
    
    await review.save();
    
    const updatedReview = await Review.findById(id)
      .populate('user', 'firstname lastname email role')
      .populate('product');
    
    res.status(200).json(createResponse('success', {
      review: {
        id: updatedReview._id,
        user: updatedReview.user,
        product: updatedReview.product,
        rating: updatedReview.rating,
        comment: updatedReview.comment,
        status: updatedReview.status,
        rejectedBy: updatedReview.rejectedBy,
        rejectedAt: updatedReview.rejectedAt,
        rejectionReason: updatedReview.rejectionReason,
        createdAt: updatedReview.createdAt
      }
    }, getBilingualMessage('review_updated_successfully')));
  } catch (err) {
    console.error('Update review error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_review') });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    }
    
    await Review.findByIdAndDelete(id);
    
    res.status(200).json(createResponse('success', null, getBilingualMessage('review_deleted_successfully')));
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_review') });
  }
};

exports.rejectReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validate admin permissions
    const permissionError = validateAdminPermissions(req, res);
    if (permissionError) return;
    
    // Validate rejection reason
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('rejection_reason_required') 
      });
    }
    
    const review = await Review.findById(id)
      .populate('user', 'firstname lastname email')
      .populate('product', 'name');
    
    if (!review) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('review_not_found') });
    }
    
    // Check if review is already rejected
    if (review.status === 'reject') {
      return res.status(400).json({ 
        status: 'error', 
        message: getBilingualMessage('review_already_rejected') 
      });
    }
    
    // Update review status
    review.status = 'reject';
    review.rejectedBy = req.user.id;
    review.rejectedAt = new Date();
    review.rejectionReason = reason.trim();
    
    await review.save();
    
    // Send email notification to the user
    try {
      const { sendReviewRejectionNotification } = require('../utils/email-utils');
      const userName = `${review.user.firstname} ${review.user.lastname}`;
      const productName = review.product.name.en || review.product.name; // Handle bilingual name
      
      await sendReviewRejectionNotification(
        review.user.email,
        userName,
        productName,
        review.rejectionReason
      );
    } catch (emailError) {
      console.error('Failed to send review rejection email:', emailError);
      // Don't fail the request if email fails, just log it
    }
    
    // Populate the rejectedBy field for response
    await review.populate('rejectedBy', 'firstname lastname email role');
    
    res.status(200).json(createResponse('success', {
      review: {
        id: review._id,
        user: review.user,
        product: review.product,
        rating: review.rating,
        comment: review.comment,
        status: review.status,
        rejectedBy: review.rejectedBy,
        rejectedAt: review.rejectedAt,
        rejectionReason: review.rejectionReason,
        createdAt: review.createdAt
      }
    }, getBilingualMessage('review_rejected_successfully')));
  } catch (err) {
    console.error('Reject review error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_reject_review') });
  }
};



// ========================================
// ADMIN ADDRESS MANAGEMENT
// ========================================

exports.getAllAddresses = async (req, res) => {
  try {
    const { page = 1, limit = 10, userName, city, country } = req.query;
    const query = {};
    
    // Handle user search by name, email, or phone
    if (userName && userName.trim()) {
      const searchTerm = userName.trim();
      // Create search patterns for better matching
      const searchPatterns = [
        searchTerm, // Exact match
        `.*${searchTerm}.*`, // Contains anywhere
        `^${searchTerm}.*`, // Starts with
        `.*${searchTerm}$` // Ends with
      ];
      
      const userFilter = {
        $or: [
          // Search in firstname with multiple patterns
          ...searchPatterns.map(pattern => ({ firstname: { $regex: pattern, $options: 'i' } })),
          // Search in lastname with multiple patterns
          ...searchPatterns.map(pattern => ({ lastname: { $regex: pattern, $options: 'i' } })),
          // Search in email
          { email: { $regex: searchTerm, $options: 'i' } },
          // Search in phone
          { phone: { $regex: searchTerm, $options: 'i' } },
          // Search in full name (concatenated)
          { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: searchTerm, options: 'i' } } }
        ]
      };
      
      // Find users first, then find their addresses
      const users = await User.find(userFilter).select('_id');
      const userIds = users.map(user => user._id);
      query.user = { $in: userIds };
    }
    
    if (city) query.city = { $regex: city, $options: 'i' };
    if (country) query.country = { $regex: country, $options: 'i' };
    
    const skip = (page - 1) * limit;
    const addresses = await Address.find(query)
      .populate('user', 'firstname lastname email role phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Address.countDocuments(query);
    
    res.status(200).json(createResponse('success', {
      addresses: addresses.map(address => ({
        id: address._id,
        user: address.user,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt
      }))
    }, null, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }));
  } catch (err) {
    console.error('Get all addresses error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_addresses') });
  }
};

exports.getAddressById = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findById(id)
      .populate('user', 'firstname lastname email role');
    
    if (!address) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    res.status(200).json(createResponse('success', {
      address: {
        id: address._id,
        user: address.user,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt
      }
    }));
  } catch (err) {
    console.error('Get address by ID error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_address') });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const { userId, addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    if (!userId || !addressLine1 || !city || !state || !postalCode || !country) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('missing_required_fields') });
    }
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    
    const address = new Address({
      user: userId,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country
    });
    
    await address.save();
    
    const populatedAddress = await Address.findById(address._id)
      .populate('user', 'firstname lastname email role');
    
    res.status(201).json(createResponse('success', {
      address: {
        id: populatedAddress._id,
        user: populatedAddress.user,
        addressLine1: populatedAddress.addressLine1,
        addressLine2: populatedAddress.addressLine2,
        city: populatedAddress.city,
        state: populatedAddress.state,
        postalCode: populatedAddress.postalCode,
        country: populatedAddress.country,
        createdAt: populatedAddress.createdAt,
        updatedAt: populatedAddress.updatedAt
      }
    }, getBilingualMessage('address_created_successfully')));
  } catch (err) {
    console.error('Create address error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_address') });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { addressLine1, addressLine2, city, state, postalCode, country } = req.body;
    
    const address = await Address.findById(id);
    if (!address) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (postalCode !== undefined) address.postalCode = postalCode;
    if (country !== undefined) address.country = country;
    
    address.updatedAt = new Date();
    await address.save();
    
    const updatedAddress = await Address.findById(id)
      .populate('user', 'firstname lastname email role');
    
    res.status(200).json(createResponse('success', {
      address: {
        id: updatedAddress._id,
        user: updatedAddress.user,
        addressLine1: updatedAddress.addressLine1,
        addressLine2: updatedAddress.addressLine2,
        city: updatedAddress.city,
        state: updatedAddress.state,
        postalCode: updatedAddress.postalCode,
        country: updatedAddress.country,
        createdAt: updatedAddress.createdAt,
        updatedAt: updatedAddress.updatedAt
      }
    }, getBilingualMessage('address_updated_successfully')));
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_address') });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await Address.findById(id);
    
    if (!address) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    await Address.findByIdAndDelete(id);
    
    res.status(200).json(createResponse('success', null, getBilingualMessage('address_deleted_successfully')));
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_address') });
  }
};

// ========================================
// ADMIN ORDER MANAGEMENT
// ========================================

exports.getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, customerName, status, date } = req.query;
    const query = {};
    
    if (status) {
      // Handle bilingual status field - search in both English and Arabic
      query.$or = [
        { 'status.en': status },
        { 'status.ar': status }
      ];
    }
    if (date) {
      // Filter orders created on a specific date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      query.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }
    
    const skip = (page - 1) * limit;
    
    // If customerName is provided, search for customers with matching names
    let customerFilter = {};
    if (customerName && customerName.trim()) {
      const searchTerm = customerName.trim();
      // Create search patterns for better matching
      const searchPatterns = [
        searchTerm, // Exact match
        `.*${searchTerm}.*`, // Contains anywhere
        `^${searchTerm}.*`, // Starts with
        `.*${searchTerm}$` // Ends with
      ];
      
      customerFilter = {
        $or: [
          // Search in firstname with multiple patterns
          ...searchPatterns.map(pattern => ({ firstname: { $regex: pattern, $options: 'i' } })),
          // Search in lastname with multiple patterns
          ...searchPatterns.map(pattern => ({ lastname: { $regex: pattern, $options: 'i' } })),
          // Search in email
          { email: { $regex: searchTerm, $options: 'i' } },
          // Search in phone
          { phone: { $regex: searchTerm, $options: 'i' } },
          // Search in full name (concatenated)
          { $expr: { $regexMatch: { input: { $concat: ['$firstname', ' ', '$lastname'] }, regex: searchTerm, options: 'i' } } }
        ]
      };
    }
    
    let orders;
    if (customerName) {
      // Find customers first, then find their orders
      const customers = await User.find(customerFilter).select('_id');
      const customerIds = customers.map(customer => customer._id);
      query.customer = { $in: customerIds };
      
      orders = await Order.find(query)
        .populate('customer', 'firstname lastname email role')
        .populate('shippingAddress')
        .populate({
          path: 'items.product',
          select: 'name code status category pricePerUnit'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    } else {
      orders = await Order.find(query)
        .populate('customer', 'firstname lastname email role')
        .populate('shippingAddress')
        .populate({
          path: 'items.product',
          select: 'name code status category pricePerUnit'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
    }
    
    const total = await Order.countDocuments(query);
    
    const language = req.query.lang || 'en';
    const { formatOrder } = require('../utils/response-formatters');
    
    res.status(200).json(createResponse('success', {
      orders: orders.map(order => formatOrder(order, { 
        language,
        includeItems: true,
        includeCustomer: true,
        includeAddress: true,
        includeStatusLog: false,
        includeTotal: true
      }))
    }, null, {
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    }));
  } catch (err) {
    console.error('Get all orders error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_orders') });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('customer', 'firstname lastname email role phone')
      .populate('shippingAddress')
      .populate({
        path: 'items.product',
        select: 'name code status category description pricePerUnit images'
      });
    
    if (!order) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('order_not_found') });
    }
    
    const language = req.query.lang || 'en';
    const { formatOrder } = require('../utils/response-formatters');
    
    res.status(200).json(createResponse('success', {
      order: formatOrder(order, { 
        language,
        includeItems: true,
        includeCustomer: true,
        includeAddress: true,
        includeStatusLog: true,
        includeTotal: true
      })
    }));
  } catch (err) {
    console.error('Get order by ID error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_order') });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { customerId, items, shippingAddressId } = req.body;
    
    if (!customerId || !items || !shippingAddressId) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('missing_required_fields') });
    }
    
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('order_must_have_items') });
    }
    
    // Check if customer exists
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    
    // Check if shipping address exists
    const shippingAddress = await Address.findById(shippingAddressId);
    if (!shippingAddress) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
    }
    
    // Validate items and prepare for calculation
    const orderItems = [];
    const productPrices = {};
    
    for (const item of items) {
      if (!item.product || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_order_items') });
      }
      
      const product = await Product.findById(item.product).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
      if (!product) {
        return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
      }
      
      if (product.status !== 'approved') {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('product_not_approved') });
      }
      
      const price = parseFloat(product.pricePerUnit) || 0;
      productPrices[item.product] = price;
      
      orderItems.push({
        product: item.product,
        quantity: item.quantity,
        itemTotal: price * item.quantity
      });
    }
    
    const order = new Order({
      customer: customerId,
      items: orderItems,
      shippingAddress: shippingAddressId,
      status: { en: 'pending', ar: 'قيد الانتظار' },
      statusLog: [{
        status: { en: 'pending', ar: 'قيد الانتظار' },
        timestamp: new Date()
      }]
    });
    
    // Calculate total using the product prices we fetched
    order.calculateTotal(productPrices);
    await order.save();
    
    const populatedOrder = await Order.findById(order._id)
      .populate('customer', 'firstname lastname email role')
      .populate('shippingAddress')
      .populate({
        path: 'items.product',
        select: 'name code status category'
      });
    
    const language = req.query.lang || 'en';
    const { formatOrder } = require('../utils/response-formatters');
    
    res.status(201).json(createResponse('success', {
      order: formatOrder(populatedOrder, { 
        language,
        includeItems: true,
        includeCustomer: true,
        includeAddress: true,
        includeStatusLog: true,
        includeTotal: true
      })
    }, getBilingualMessage('order_created_successfully')));
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_create_order') });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items, shippingAddressId, status } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('order_not_found') });
    }
    
    // Update items if provided
    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('order_must_have_items') });
      }
      
      // Validate items and prepare for calculation
      const orderItems = [];
      const productPrices = {};
      
      for (const item of items) {
        if (!item.product || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_order_items') });
        }
        
        const product = await Product.findById(item.product).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
        if (!product) {
          return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
        }
        
        if (product.status !== 'approved') {
          return res.status(400).json({ status: 'error', message: getBilingualMessage('product_not_approved') });
        }
        
        const price = parseFloat(product.pricePerUnit) || 0;
        productPrices[item.product] = price;
        
        orderItems.push({
          product: item.product,
          quantity: item.quantity,
          itemTotal: price * item.quantity
        });
      }
      
      order.items = orderItems;
      // Recalculate total with new items
      order.calculateTotal(productPrices);
    }
    
    // Update shipping address if provided
    if (shippingAddressId) {
      const shippingAddress = await Address.findById(shippingAddressId);
      if (!shippingAddress) {
        return res.status(404).json({ status: 'error', message: getBilingualMessage('address_not_found') });
      }
      order.shippingAddress = shippingAddressId;
    }
    
    // Update status if provided
    if (status) {
      const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_order_status') });
      }
      
      const statusMap = {
        pending: { en: 'pending', ar: 'قيد الانتظار' },
        confirmed: { en: 'confirmed', ar: 'مؤكد' },
        shipped: { en: 'shipped', ar: 'تم الشحن' },
        delivered: { en: 'delivered', ar: 'تم التوصيل' },
        cancelled: { en: 'cancelled', ar: 'ملغي' }
      };
      
      order.status = statusMap[status];
      order.statusLog.push({
        status: statusMap[status],
        timestamp: new Date()
      });
    }
    
    order.updatedAt = new Date();
    await order.save();
    
    const updatedOrder = await Order.findById(id)
      .populate('customer', 'firstname lastname email role')
      .populate('shippingAddress')
      .populate({
        path: 'items.product',
        select: 'name code status category'
      });
    
    const language = req.query.lang || 'en';
    const { formatOrder } = require('../utils/response-formatters');
    
    res.status(200).json(createResponse('success', {
      order: formatOrder(updatedOrder, { 
        language,
        includeItems: true,
        includeCustomer: true,
        includeAddress: true,
        includeStatusLog: true,
        includeTotal: true
      })
    }, getBilingualMessage('order_updated_successfully')));
  } catch (err) {
    console.error('Update order error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_order') });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('order_not_found') });
    }
    
    await Order.findByIdAndDelete(id);
    
    res.status(200).json(createResponse('success', null, getBilingualMessage('order_deleted_successfully')));
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_order') });
  }
};
