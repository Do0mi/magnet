// Dashboard Products Controller - Admin/Employee Product Management
const Product = require('../../../models/product-model');
const Category = require('../../../models/category-model');
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct, formatReview } = require('../../../utils/response-formatters');
const { attachReviewCountsToProducts } = require('../../../utils/review-helpers');

// Base currency for dashboard (always USD)
const BASE_CURRENCY = 'USD';
// Magnet company name constant
const MAGNET_COMPANY_NAME = 'Magnet';
const { 
  sendProductApprovalNotification, 
  sendProductDeclineNotification, 
  sendProductAllowNotification, 
  sendProductDisallowNotification 
} = require('../../../utils/email-utils');

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

// GET /api/v1/dashboard/products - Get all products
exports.getProducts = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build aggregation pipeline
    const pipeline = [];

    // Match stage for basic filters
    const matchStage = {};
    if (category) matchStage.category = category;
    if (status) matchStage.status = status;

    // If search is provided, we need to use aggregation to search across populated fields
    if (search) {
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'owner',
          foreignField: '_id',
          as: 'ownerInfo'
        }
      });

      pipeline.push({
        $match: {
          ...matchStage,
          $or: [
            { 'name.en': { $regex: search, $options: 'i' } },
            { 'name.ar': { $regex: search, $options: 'i' } },
            { 'description.en': { $regex: search, $options: 'i' } },
            { 'description.ar': { $regex: search, $options: 'i' } },
            { code: { $regex: search, $options: 'i' } },
            { 'ownerInfo.firstname': { $regex: search, $options: 'i' } },
            { 'ownerInfo.lastname': { $regex: search, $options: 'i' } }
          ]
        }
      });

      // Add lookup for category
      pipeline.push({
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryInfo'
        }
      });

      // Project to format the data similar to populate
      pipeline.push({
        $project: {
          code: 1,
          category: 1,
          name: 1,
          images: 1,
          description: 1,
          unit: 1,
          minOrder: 1,
          pricePerUnit: 1,
          stock: 1,
          customFields: 1,
          attachments: 1,
          status: 1,
          isAllowed: 1,
          declinedReason: 1,
          owner: {
            _id: { $arrayElemAt: ['$ownerInfo._id', 0] },
            firstname: { $arrayElemAt: ['$ownerInfo.firstname', 0] },
            lastname: { $arrayElemAt: ['$ownerInfo.lastname', 0] },
            email: { $arrayElemAt: ['$ownerInfo.email', 0] },
            role: { $arrayElemAt: ['$ownerInfo.role', 0] },
            businessInfo: { $arrayElemAt: ['$ownerInfo.businessInfo', 0] }
          },
          approvedBy: 1,
          rating: 1,
          createdAt: 1,
          updatedAt: 1
        }
      });

      // Sort by creation date
      pipeline.push({ $sort: { createdAt: -1 } });

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: parseInt(limit) });

      // Execute aggregation
      const products = await Product.aggregate(pipeline);
      await attachReviewCountsToProducts(products);

      // Get total count for pagination
      const countPipeline = [
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'ownerInfo'
          }
        },
        {
          $match: {
            ...matchStage,
            $or: [
              { 'name.en': { $regex: search, $options: 'i' } },
              { 'name.ar': { $regex: search, $options: 'i' } },
              { 'description.en': { $regex: search, $options: 'i' } },
              { 'description.ar': { $regex: search, $options: 'i' } },
              { code: { $regex: search, $options: 'i' } },
              { 'ownerInfo.firstname': { $regex: search, $options: 'i' } },
              { 'ownerInfo.lastname': { $regex: search, $options: 'i' } }
            ]
          }
        },
        { $count: 'total' }
      ];

      const countResult = await Product.aggregate(countPipeline);
      const total = countResult.length > 0 ? countResult[0].total : 0;

      const formattedProducts = products.map(product => formatProduct(product));

      res.status(200).json(createResponse('success', {
        products: formattedProducts,
        currency: BASE_CURRENCY,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }));

    } else {
      // No search - use regular find with populate
      const filter = matchStage;

      const products = await Product.find(filter)
        .populate('owner', 'firstname lastname email role businessInfo.companyName')
        .populate('approvedBy', 'firstname lastname email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      await attachReviewCountsToProducts(products);

      const total = await Product.countDocuments(filter);

      const formattedProducts = products.map(product => formatProduct(product));

      res.status(200).json(createResponse('success', {
        products: formattedProducts,
        currency: BASE_CURRENCY,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalProducts: total,
          limit: parseInt(limit)
        }
      }));
    }

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_products')
    });
  }
};

// GET /api/v1/dashboard/products/:id - Get product by id
exports.getProductById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const product = await Product.findById(req.params.id)
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    await attachReviewCountsToProducts([product]);
    const formattedProduct = formatProduct(product);

    res.status(200).json(createResponse('success', { 
      product: formattedProduct,
      currency: BASE_CURRENCY
    }));

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_product')
    });
  }
};

// POST /api/v1/dashboard/products/product - Create product to a specific business user
exports.createProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { businessUserId, category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments } = req.body;
    let { code } = req.body;

    // Validate required fields
    if (!businessUserId || !name || !description || !pricePerUnit || !category) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // Check if user exists
    const businessUser = await User.findById(businessUserId);
    if (!businessUser) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('business_not_found')
      });
    }

    // Allow business, admin, or magnet_employee roles
    const allowedRoles = ['business', 'admin', 'magnet_employee'];
    if (!allowedRoles.includes(businessUser.role)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('user_not_business')
      });
    }

    // For business users, check if they are approved and allowed
    if (businessUser.role === 'business') {
      if (businessUser.businessInfo?.approvalStatus !== 'approved') {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('business_not_approved')
        });
      }

      if (!businessUser.isAllowed) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('business_not_allowed')
        });
      }
    }

    // Validate custom fields
    if (!customFields || !Array.isArray(customFields) || customFields.length < 3 || customFields.length > 10) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_custom_fields_count') });
    }

    // Validate bilingual fields
    if (!name || !name.en || !name.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_name_required_both_languages') });
    }

    if (description && (!description.en || !description.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_description_required_both_languages') });
    }

    if (!category || !category.en || !category.ar) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_category_required_both_languages') });
    }

    if (unit && (!unit.en || !unit.ar)) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('product_unit_required_both_languages') });
    }

    // Validate custom fields have bilingual content
    for (let field of customFields) {
      if (!field.key || !field.key.en || !field.key.ar || !field.value || !field.value.en || !field.value.ar) {
        return res.status(400).json({ status: 'error', message: getBilingualMessage('custom_fields_required_both_languages') });
      }
    }

    // Check if category exists and is active
    const Category = require('../../../models/category-model');
    const categoryExists = await Category.findOne({
      'name.en': category.en,
      'name.ar': category.ar
    });
    
    if (!categoryExists) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    // Check if category is active
    if (categoryExists.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_inactive')
      });
    }

    // Validate attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentProducts = await Product.find({
        _id: { $in: attachments },
        status: 'approved',
        isAllowed: true
      }).select('_id status isAllowed');
      
      if (attachmentProducts.length !== attachments.length) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('invalid_attachments')
        });
      }
    }

    // Generate product code if not provided
    if (!code) {
      const generateProductCode = require('../../../utils/generateProductCode');
      code = await generateProductCode();
    }

    const product = new Product({
      code,
      category,
      name,
      images: images || [],
      description,
      unit,
      minOrder,
      pricePerUnit,
      stock: stock || 0,
      customFields,
      attachments: attachments || [],
      status: 'approved', // Auto-approve products created by admin/employee
      isAllowed: true, // Auto-allow products created by admin/employee
      owner: businessUserId,
      approvedBy: req.user.id
    });

    await product.save();
    await product.populate('owner', 'firstname lastname email role businessInfo.companyName');
    await product.populate('approvedBy', 'firstname lastname email role');
    await attachReviewCountsToProducts([product]);

    // If owner is admin or magnet_employee, set magnet company name in businessInfo
    if (product.owner && (product.owner.role === 'admin' || product.owner.role === 'magnet_employee')) {
      if (!product.owner.businessInfo) {
        product.owner.businessInfo = {};
      }
      product.owner.businessInfo.companyName = MAGNET_COMPANY_NAME;
    }

    const formattedProduct = formatProduct(product);

    res.status(201).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
    }, getBilingualMessage('product_created_success')));

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_product')
    });
  }
};

// PUT /api/v1/dashboard/products/product/:id - Update product to a specific business user
exports.updateProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments, status, declinedReason } = req.body;
    
    // Get current product to check status change
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    const oldStatus = currentProduct.status;
    const updateFields = { updatedAt: Date.now() };

    if (category) updateFields.category = category;
    if (name) updateFields.name = name;
    if (images) updateFields.images = images;
    if (description) updateFields.description = description;
    if (unit) updateFields.unit = unit;
    if (minOrder !== undefined) updateFields.minOrder = minOrder;
    if (pricePerUnit) updateFields.pricePerUnit = pricePerUnit;
    if (stock !== undefined) updateFields.stock = stock;
    if (customFields && Array.isArray(customFields) && customFields.length >= 3 && customFields.length <= 10) updateFields.customFields = customFields;
    if (attachments) updateFields.attachments = attachments;
    if (status) {
      updateFields.status = status;
      // Update isAllowed based on status
      if (status === 'approved') {
        updateFields.isAllowed = true;
        updateFields.approvedBy = req.user.id;
        updateFields.declinedReason = undefined;
      } else if (status === 'declined') {
        updateFields.isAllowed = false;
        if (declinedReason) updateFields.declinedReason = declinedReason;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    await attachReviewCountsToProducts([product]);
    const formattedProduct = formatProduct(product);

    // Send email notification if status changed
    if (status && status !== oldStatus) {
      try {
        const owner = await User.findById(product.owner).select('email firstname lastname');
        const actionUser = await User.findById(req.user.id).select('firstname lastname');
        
        if (owner && actionUser) {
          const productName = product.name?.en || product.name?.ar || 'Unknown Product';
          const actionBy = `${actionUser.firstname} ${actionUser.lastname}`;
          
          if (status === 'approved' && oldStatus !== 'approved') {
            // Status changed to approved
            await sendProductApprovalNotification(
              owner.email,
              `${owner.firstname} ${owner.lastname}`,
              productName,
              actionBy,
              new Date()
            );
          } else if (status === 'declined' && oldStatus !== 'declined') {
            // Status changed to declined
            await sendProductDeclineNotification(
              owner.email,
              `${owner.firstname} ${owner.lastname}`,
              productName,
              actionBy,
              new Date(),
              declinedReason || product.declinedReason || 'No reason provided'
            );
          }
        }
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
    }, getBilingualMessage('product_updated_success')));

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_product')
    });
  }
};

// DELETE /api/v1/dashboard/products/product/:id - Delete product to a specific business user
exports.deleteProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', null, getBilingualMessage('product_deleted_success')));

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_product')
    });
  }
};

// PUT /api/v1/dashboard/products/product/:id/approve - Approve product to a specific business user
exports.approveProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved', 
        isAllowed: true,
        approvedBy: req.user.id, 
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    await attachReviewCountsToProducts([product]);
    const formattedProduct = formatProduct(product);

    // Send approval email notification
    try {
      const owner = await User.findById(product.owner).select('email firstname lastname');
      const approver = await User.findById(req.user.id).select('firstname lastname');
      if (owner && approver) {
        const productName = product.name?.en || product.name?.ar || 'Unknown Product';
        const approvedBy = `${approver.firstname} ${approver.lastname}`;
        await sendProductApprovalNotification(
          owner.email,
          `${owner.firstname} ${owner.lastname}`,
          productName,
          approvedBy,
          new Date()
        );
      }
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
    }, getBilingualMessage('product_approved_success')));

  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_approve_product')
    });
  }
};

// PUT /api/v1/dashboard/products/product/:id/decline - Decline product to a specific business user
exports.declineProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { reason } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'declined', 
        isAllowed: false,
        declinedReason: reason,
        approvedBy: req.user.id,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

  await attachReviewCountsToProducts([product]);
    const formattedProduct = formatProduct(product);

    // Send decline email notification
    try {
      const owner = await User.findById(product.owner).select('email firstname lastname');
      const decliner = await User.findById(req.user.id).select('firstname lastname');
      if (owner && decliner) {
        const productName = product.name?.en || product.name?.ar || 'Unknown Product';
        const declinedBy = `${decliner.firstname} ${decliner.lastname}`;
        await sendProductDeclineNotification(
          owner.email,
          `${owner.firstname} ${owner.lastname}`,
          productName,
          declinedBy,
          new Date(),
          reason
        );
      }
    } catch (emailError) {
      console.error('Failed to send decline email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
    }, getBilingualMessage('product_declined_success')));

  } catch (error) {
    console.error('Decline product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_decline_product')
    });
  }
};

// PUT /api/v1/dashboard/products/product/:id/toggle - Toggle allow product to a specific business user
exports.toggleProduct = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isAllowed: !product.isAllowed },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');
    await attachReviewCountsToProducts([updatedProduct]);

    const formattedProduct = formatProduct(updatedProduct);

    // Send allow/disallow email notification
    try {
      const owner = await User.findById(updatedProduct.owner).select('email firstname lastname');
      const actionUser = await User.findById(req.user.id).select('firstname lastname');
      if (owner && actionUser) {
        const productName = updatedProduct.name?.en || updatedProduct.name?.ar || 'Unknown Product';
        const actionBy = `${actionUser.firstname} ${actionUser.lastname}`;
        
        if (updatedProduct.isAllowed) {
          // Product was allowed
          await sendProductAllowNotification(
            owner.email,
            `${owner.firstname} ${owner.lastname}`,
            productName,
            actionBy,
            new Date()
          );
        } else {
          // Product was disallowed
          await sendProductDisallowNotification(
            owner.email,
            `${owner.firstname} ${owner.lastname}`,
            productName,
            actionBy,
            new Date()
          );
        }
      }
    } catch (emailError) {
      console.error('Failed to send toggle email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
    }, getBilingualMessage('product_toggled_success')));

  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_product')
    });
  }
};

// GET /api/v1/dashboard/products/:id/reviews - Get a specific product reviews
exports.getProductReviews = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const Review = require('../../../models/review-model');
    
    const reviews = await Review.find({ product: req.params.id })
      .populate('user', 'firstname lastname email role')
      .populate('rejectedBy', 'firstname lastname email role')
      .populate({
        path: 'product',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'product',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ product: req.params.id });
    const formattedReviews = reviews.map(review => formatReview(review));

    res.status(200).json(createResponse('success', {
      reviews: formattedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReviews: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_reviews')
    });
  }
};

// GET /api/v1/dashboard/products/:id/orders - Get a specific product orders
exports.getProductOrders = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const Order = require('../../../models/order-model');
    
    const orders = await Order.find({ 'items.product': req.params.id })
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ 'items.product': req.params.id });

    // Format orders response
    const formattedOrders = orders.map(order => ({
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: {
        id: order.customer._id || order.customer,
        name: (order.customer.firstname && order.customer.lastname) 
          ? `${order.customer.firstname} ${order.customer.lastname}`.trim()
          : (order.customer.fullName || 'Unknown User'),
        email: order.customer.email
      },
      items: order.items.map(item => ({
        id: item._id,
        product: {
          id: item.product._id,
          name: item.product.name,
          images: item.product.images,
          pricePerUnit: item.product.pricePerUnit
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost || 0,
      total: order.total,
      shippingAddress: order.shippingAddress ? {
        id: order.shippingAddress._id,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.status(200).json(createResponse('success', {
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalOrders: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get product orders error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_orders')
    });
  }
};

// GET /api/v1/dashboard/products/:productId/reviews/:reviewId - Get a specific product review by id
exports.getProductReviewById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const Review = require('../../../models/review-model');
    
    const review = await Review.findOne({ 
      _id: req.params.reviewId, 
      product: req.params.productId 
    })
      .populate('user', 'firstname lastname email role')
      .populate('rejectedBy', 'firstname lastname email role')
      .populate({
        path: 'product',
        populate: {
          path: 'owner',
          select: 'firstname lastname email businessInfo.companyName'
        }
      })
      .populate({
        path: 'product',
        populate: {
          path: 'approvedBy',
          select: 'firstname lastname email role'
        }
      });

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    const formattedReview = formatReview(review);
    res.status(200).json(createResponse('success', { review: formattedReview }));

  } catch (error) {
    console.error('Get product review by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_review')
    });
  }
};

// GET /api/v1/dashboard/products/:productId/orders/:orderId - Get a specific product order by id
exports.getProductOrderById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const Order = require('../../../models/order-model');
    
    const order = await Order.findOne({ 
      _id: req.params.orderId, 
      'items.product': req.params.productId 
    })
      .populate('customer', 'firstname lastname email')
      .populate('items.product', 'name pricePerUnit images')
      .populate('shippingAddress', 'addressLine1 addressLine2 city state postalCode country');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    // Format the order response
    const formattedOrder = {
      id: order._id,
      orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
      customer: {
        id: order.customer._id || order.customer,
        name: (order.customer.firstname && order.customer.lastname) 
          ? `${order.customer.firstname} ${order.customer.lastname}`.trim()
          : (order.customer.fullName || 'Unknown User'),
        email: order.customer.email
      },
      items: order.items.map(item => ({
        id: item._id,
        product: {
          id: item.product._id,
          name: item.product.name,
          images: item.product.images,
          pricePerUnit: item.product.pricePerUnit
        },
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        itemTotal: item.itemTotal
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost || 0,
      total: order.total,
      shippingAddress: order.shippingAddress ? {
        id: order.shippingAddress._id,
        addressLine1: order.shippingAddress.addressLine1,
        addressLine2: order.shippingAddress.addressLine2,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country
      } : null,
      status: order.status,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };

    res.status(200).json(createResponse('success', { order: formattedOrder }));

  } catch (error) {
    console.error('Get product order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};
