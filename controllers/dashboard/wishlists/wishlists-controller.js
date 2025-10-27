// Dashboard Wishlists Controller - Admin/Employee Wishlist Management
const Wishlist = require('../../../models/wishlist-model');
const User = require('../../../models/user-model');
const Product = require('../../../models/product-model');
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

// GET /api/v1/dashboard/wishlists - Get all wishlists
exports.getWishlists = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { 'user.firstname': { $regex: search, $options: 'i' } },
        { 'user.lastname': { $regex: search, $options: 'i' } },
        { 'user.email': { $regex: search, $options: 'i' } },
        { 'products.name': { $regex: search, $options: 'i' } }
      ];
    }

    const wishlists = await Wishlist.find(filter)
      .populate('user', 'firstname lastname email')
      .populate('products', 'name price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Wishlist.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      wishlists,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalWishlists: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get all wishlists error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_wishlists')
    });
  }
};

// GET /api/v1/dashboard/wishlists/:id - Get wishlist by id
exports.getWishlistById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const wishlist = await Wishlist.findById(req.params.id)
      .populate('user', 'firstname lastname email')
      .populate('products', 'name price images description');

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('wishlist_not_found')
      });
    }

    res.status(200).json(createResponse('success', { wishlist }));

  } catch (error) {
    console.error('Get wishlist by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_wishlist')
    });
  }
};

// POST /api/v1/dashboard/wishlists/wishlist - Create wishlist
exports.createWishlist = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { userId, productIds = [] } = req.body;

    // Validate required fields
    if (!userId) {
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

    // Check if wishlist already exists for this user
    const existingWishlist = await Wishlist.findOne({ user: userId });
    if (existingWishlist) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('wishlist_already_exists')
      });
    }

    // Validate products if provided
    if (productIds.length > 0) {
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('some_products_not_found')
        });
      }
    }

    const wishlist = new Wishlist({
      user: userId,
      products: productIds
    });

    await wishlist.save();

    await wishlist.populate('user', 'firstname lastname email');
    await wishlist.populate('products', 'name price images');

    res.status(201).json(createResponse('success', {
      wishlist
    }, getBilingualMessage('wishlist_created_success')));

  } catch (error) {
    console.error('Create wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_wishlist')
    });
  }
};

// PUT /api/v1/dashboard/wishlists/wishlist/:id - Update wishlist
exports.updateWishlist = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { productIds } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (productIds && Array.isArray(productIds)) {
      // Validate products
      const products = await Product.find({ _id: { $in: productIds } });
      if (products.length !== productIds.length) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('some_products_not_found')
        });
      }
      updateFields.products = productIds;
    }

    const wishlist = await Wishlist.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('user', 'firstname lastname email')
      .populate('products', 'name price images');

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('wishlist_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      wishlist
    }, getBilingualMessage('wishlist_updated_success')));

  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_wishlist')
    });
  }
};

// DELETE /api/v1/dashboard/wishlists/wishlist/:id - Delete wishlist
exports.deleteWishlist = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const wishlist = await Wishlist.findByIdAndDelete(req.params.id);

    if (!wishlist) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('wishlist_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('wishlist_deleted_success')));

  } catch (error) {
    console.error('Delete wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_wishlist')
    });
  }
};
