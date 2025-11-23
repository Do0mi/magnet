// Dashboard Special Orders Controller - Admin/Employee Special Order Management
const SpecialOrder = require('../../../models/special-order-model');
const Product = require('../../../models/product-model');
const User = require('../../../models/user-model');
const { SPECIAL_ORDER_STATUS } = require('../../../models/special-order-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct, formatUser } = require('../../../utils/response-formatters');

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

// Format special order response for dashboard
const formatSpecialOrder = (specialOrder) => {
  if (!specialOrder) return null;
  
  return {
    id: specialOrder._id,
    user: specialOrder.userId && typeof specialOrder.userId === 'object'
      ? formatUser(specialOrder.userId, {
          includePassword: false,
          includeOTP: false,
          includeBusinessInfo: true,
          includeVerification: true
        })
      : specialOrder.userId,
    product: specialOrder.productId && typeof specialOrder.productId === 'object'
      ? formatProduct(specialOrder.productId, {
          includeOwner: true,
          includeApproval: true
        })
      : specialOrder.productId,
    needs: specialOrder.needs,
    reason: specialOrder.reason,
    status: specialOrder.status,
    reviewedBy: specialOrder.reviewedBy && typeof specialOrder.reviewedBy === 'object'
      ? formatUser(specialOrder.reviewedBy, {
          includePassword: false,
          includeOTP: false,
          includeBusinessInfo: false,
          includeVerification: false
        })
      : specialOrder.reviewedBy,
    reviewedAt: specialOrder.reviewedAt,
    notes: specialOrder.notes,
    createdAt: specialOrder.createdAt,
    updatedAt: specialOrder.updatedAt
  };
};

// GET /api/v1/dashboard/special-orders - Get all special orders
exports.getSpecialOrders = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, userId, productId, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (productId) filter.productId = productId;
    
    // Search functionality
    if (search) {
      filter.$or = [
        { needs: { $regex: search, $options: 'i' } },
        { reason: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Get special orders with pagination
    const specialOrders = await SpecialOrder.find(filter)
      .populate({
        path: 'userId',
        select: 'firstname lastname email phone role country imageUrl businessInfo'
      })
      .populate({
        path: 'productId',
        populate: [
          {
            path: 'owner',
            select: 'firstname lastname email role businessInfo.companyName'
          },
          {
            path: 'category',
            select: 'name description'
          }
        ]
      })
      .populate({
        path: 'reviewedBy',
        select: 'firstname lastname email role'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await SpecialOrder.countDocuments(filter);

    // Format special orders
    const formattedOrders = specialOrders.map(formatSpecialOrder);

    res.status(200).json(createResponse('success', {
      specialOrders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }));

  } catch (error) {
    console.error('Get all special orders error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_special_orders')
    });
  }
};

// GET /api/v1/dashboard/special-orders/:id - Get special order by id
exports.getSpecialOrderById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const specialOrder = await SpecialOrder.findById(id)
      .populate({
        path: 'userId',
        select: 'firstname lastname email phone role country imageUrl businessInfo'
      })
      .populate({
        path: 'productId',
        populate: [
          {
            path: 'owner',
            select: 'firstname lastname email role businessInfo.companyName'
          },
          {
            path: 'category',
            select: 'name description'
          }
        ]
      })
      .populate({
        path: 'reviewedBy',
        select: 'firstname lastname email role'
      });

    if (!specialOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('special_order_not_found')
      });
    }

    const formattedOrder = formatSpecialOrder(specialOrder);

    res.status(200).json(createResponse('success', {
      specialOrder: formattedOrder
    }));

  } catch (error) {
    console.error('Get special order by id error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_special_order')
    });
  }
};

// POST /api/v1/dashboard/special-orders - Create a special order (admin can create on behalf of user)
exports.createSpecialOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { userId, productId, needs, reason } = req.body;

    // Validate required fields
    if (!userId || !productId || !needs || !reason) {
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

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    // Create special order
    const specialOrder = new SpecialOrder({
      userId,
      productId,
      needs: needs.trim(),
      reason: reason.trim()
    });

    await specialOrder.save();

    // Populate for response
    await specialOrder.populate({
      path: 'userId',
      select: 'firstname lastname email phone role country imageUrl businessInfo'
    });
    await specialOrder.populate({
      path: 'productId',
      populate: [
        {
          path: 'owner',
          select: 'firstname lastname email role businessInfo.companyName'
        },
        {
          path: 'category',
          select: 'name description'
        }
      ]
    });

    const formattedOrder = formatSpecialOrder(specialOrder);

    res.status(201).json(createResponse('success', {
      specialOrder: formattedOrder
    }, {
      en: 'Special order created successfully',
      ar: 'تم إنشاء الطلب الخاص بنجاح'
    }));

  } catch (error) {
    console.error('Create special order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_special_order')
    });
  }
};

// PUT /api/v1/dashboard/special-orders/:id - Update a special order
exports.updateSpecialOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;
    const { needs, reason, status, notes } = req.body;

    // Find the special order
    const specialOrder = await SpecialOrder.findById(id);

    if (!specialOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('special_order_not_found')
      });
    }

    // Update fields
    if (needs !== undefined) specialOrder.needs = needs.trim();
    if (reason !== undefined) specialOrder.reason = reason.trim();
    if (notes !== undefined) specialOrder.notes = notes ? notes.trim() : null;
    
    // Handle status update
    if (status !== undefined) {
      if (!Object.values(SPECIAL_ORDER_STATUS).includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_special_order_status')
        });
      }
      
      specialOrder.status = status;
      
      // If status is reviewed or contacted, set reviewedBy and reviewedAt
      if (status === SPECIAL_ORDER_STATUS.REVIEWED || status === SPECIAL_ORDER_STATUS.CONTACTED) {
        specialOrder.reviewedBy = req.user.id;
        specialOrder.reviewedAt = new Date();
      }
    }

    await specialOrder.save();

    // Populate for response
    await specialOrder.populate({
      path: 'userId',
      select: 'firstname lastname email phone role country imageUrl businessInfo'
    });
    await specialOrder.populate({
      path: 'productId',
      populate: [
        {
          path: 'owner',
          select: 'firstname lastname email role businessInfo.companyName'
        },
        {
          path: 'category',
          select: 'name description'
        }
      ]
    });
    await specialOrder.populate({
      path: 'reviewedBy',
      select: 'firstname lastname email role'
    });

    const formattedOrder = formatSpecialOrder(specialOrder);

    res.status(200).json(createResponse('success', {
      specialOrder: formattedOrder
    }, {
      en: 'Special order updated successfully',
      ar: 'تم تحديث الطلب الخاص بنجاح'
    }));

  } catch (error) {
    console.error('Update special order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_special_order')
    });
  }
};

// DELETE /api/v1/dashboard/special-orders/:id - Delete a special order
exports.deleteSpecialOrder = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    const specialOrder = await SpecialOrder.findById(id);

    if (!specialOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('special_order_not_found')
      });
    }

    await SpecialOrder.findByIdAndDelete(id);

    res.status(200).json(createResponse('success', null, {
      en: 'Special order deleted successfully',
      ar: 'تم حذف الطلب الخاص بنجاح'
    }));

  } catch (error) {
    console.error('Delete special order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_special_order')
    });
  }
};

