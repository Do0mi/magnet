// User Special Orders Controller - User Special Order Management
const SpecialOrder = require('../../../models/special-order-model');
const { SPECIAL_ORDER_STATUS } = require('../../../models/special-order-model');
const Product = require('../../../models/product-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');
const { convertCurrency, BASE_CURRENCY } = require('../../../services/currency-service');

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

// Format special order response with currency conversion
const formatSpecialOrderWithCurrency = async (specialOrder, userCurrency) => {
  if (!specialOrder) return null;
  
  let product = specialOrder.productId;
  
  // Format and convert product if it's an object
  if (product && typeof product === 'object') {
    const formatted = formatProduct(product, {
      includeOwner: false,
      includeApproval: false
    });
    
    // Convert pricePerUnit if it exists
    if (formatted.pricePerUnit) {
      const basePrice = parseFloat(formatted.pricePerUnit);
      if (!isNaN(basePrice)) {
        const convertedPrice = await convertCurrency(basePrice, userCurrency);
        formatted.pricePerUnit = convertedPrice.toString();
      }
    }
    
    product = formatted;
  }
  
  return {
    id: specialOrder._id,
    userId: specialOrder.userId?._id || specialOrder.userId,
    product,
    needs: specialOrder.needs,
    reason: specialOrder.reason,
    status: specialOrder.status,
    reviewedBy: specialOrder.reviewedBy && typeof specialOrder.reviewedBy === 'object'
      ? {
          id: specialOrder.reviewedBy._id,
          firstname: specialOrder.reviewedBy.firstname,
          lastname: specialOrder.reviewedBy.lastname,
          email: specialOrder.reviewedBy.email
        }
      : specialOrder.reviewedBy,
    reviewedAt: specialOrder.reviewedAt,
    notes: specialOrder.notes,
    createdAt: specialOrder.createdAt,
    updatedAt: specialOrder.updatedAt
  };
};

// GET /api/v1/user/special-orders - Get all special orders for the authenticated user
exports.getAllSpecialOrders = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { userId: req.user.id };
    if (status) {
      query.status = status;
    }

    // Get special orders with pagination
    const specialOrders = await SpecialOrder.find(query)
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
    const total = await SpecialOrder.countDocuments(query);

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format special orders with currency conversion
    const formattedOrders = await Promise.all(
      specialOrders.map(order => formatSpecialOrderWithCurrency(order, userCurrency))
    );

    res.status(200).json(createResponse('success', {
      specialOrders: formattedOrders,
      currency: userCurrency,
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

// GET /api/v1/user/special-orders/:id - Get a specific special order by id
exports.getSpecialOrderById = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    // Find the special order
    const specialOrder = await SpecialOrder.findById(id)
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

    // Check if the user owns this special order
    if (specialOrder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format special order with currency conversion
    const formattedOrder = await formatSpecialOrderWithCurrency(specialOrder, userCurrency);

    res.status(200).json(createResponse('success', {
      specialOrder: formattedOrder,
      currency: userCurrency
    }));

  } catch (error) {
    console.error('Get special order by id error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_special_order')
    });
  }
};

// POST /api/v1/user/special-orders - Create a special order
exports.createSpecialOrder = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { productId, needs, reason } = req.body;

    // Validate required fields
    if (!productId || !needs || !reason) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
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

    // Check if product is approved
    if (product.status !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('product_not_available')
      });
    }

    // Check if user has reached the maximum limit of 5 active special orders
    const activeSpecialOrdersCount = await SpecialOrder.countDocuments({
      userId: req.user.id,
      status: { $ne: SPECIAL_ORDER_STATUS.COMPLETED }
    });

    if (activeSpecialOrdersCount >= 5) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('max_special_orders_reached')
      });
    }

    // Check if user already has a special order for this product that is not completed
    const existingSpecialOrder = await SpecialOrder.findOne({
      userId: req.user.id,
      productId: productId,
      status: { $ne: SPECIAL_ORDER_STATUS.COMPLETED }
    });

    if (existingSpecialOrder) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('special_order_already_exists')
      });
    }

    // Create special order
    const specialOrder = new SpecialOrder({
      userId: req.user.id,
      productId,
      needs: needs.trim(),
      reason: reason.trim()
    });

    await specialOrder.save();

    // Populate product for response
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

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format special order with currency conversion
    const formattedOrder = await formatSpecialOrderWithCurrency(specialOrder, userCurrency);

    res.status(201).json(createResponse('success', {
      specialOrder: formattedOrder,
      currency: userCurrency
    }, {
      en: 'Special order created successfully. We will contact you soon.',
      ar: 'تم إنشاء الطلب الخاص بنجاح. سنقوم بالتواصل معك قريباً.'
    }));

  } catch (error) {
    console.error('Create special order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_special_order')
    });
  }
};

// PUT /api/v1/user/special-orders/:id/cancel - Cancel a special order
exports.cancelSpecialOrder = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    const { id } = req.params;

    // Find the special order
    const specialOrder = await SpecialOrder.findById(id);

    if (!specialOrder) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('special_order_not_found')
      });
    }

    // Check if the user owns this special order
    if (specialOrder.userId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    // Only allow cancellation if status is pending
    if (specialOrder.status !== SPECIAL_ORDER_STATUS.PENDING) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('cannot_cancel_reviewed_order')
      });
    }

    // Update status to cancelled
    specialOrder.status = SPECIAL_ORDER_STATUS.CANCELLED;
    await specialOrder.save();

    // Populate product for response
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

    // Get user currency from middleware (defaults to USD if not set)
    const userCurrency = req.userCurrency || BASE_CURRENCY;

    // Format special order with currency conversion
    const formattedOrder = await formatSpecialOrderWithCurrency(specialOrder, userCurrency);

    res.status(200).json(createResponse('success', {
      specialOrder: formattedOrder,
      currency: userCurrency
    }, {
      en: 'Special order cancelled successfully',
      ar: 'تم إلغاء الطلب الخاص بنجاح'
    }));

  } catch (error) {
    console.error('Cancel special order error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_cancel_special_order')
    });
  }
};

