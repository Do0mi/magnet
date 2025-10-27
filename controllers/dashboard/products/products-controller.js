// Dashboard Products Controller - Admin/Employee Product Management
const Product = require('../../../models/product-model');
const Category = require('../../../models/category-model');
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

// GET /api/v1/dashboard/products - Get all products
exports.getProducts = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, category, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        limit: parseInt(limit)
      }
    }));

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
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', { product }));

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

    const { businessUserId, name, description, price, category, images, specifications, stock, tags } = req.body;

    // Validate required fields
    if (!businessUserId || !name || !description || !price || !category) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    // Check if category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('category_not_found')
      });
    }

    // Generate product code
    const productCode = `DASH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const product = new Product({
      name,
      description,
      price,
      category,
      images: images || [],
      specifications: specifications || {},
      stock: stock || 0,
      tags: tags || [],
      owner: businessUserId,
      productCode,
      status: 'approved' // Auto-approve products created by admin/employee
    });

    await product.save();
    await product.populate('owner', 'firstname lastname email');
    await product.populate('category', 'name');

    res.status(201).json(createResponse('success', {
      product
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

    const { name, description, price, category, images, specifications, stock, tags, status } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (price !== undefined) updateFields.price = price;
    if (category) updateFields.category = category;
    if (images) updateFields.images = images;
    if (specifications) updateFields.specifications = specifications;
    if (stock !== undefined) updateFields.stock = stock;
    if (tags) updateFields.tags = tags;
    if (status) updateFields.status = status;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      product
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
      { status: 'approved', updatedAt: Date.now() },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      product
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
        declineReason: reason,
        updatedAt: Date.now() 
      },
      { new: true, runValidators: true }
    )
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name');

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      product
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
      .populate('owner', 'firstname lastname email')
      .populate('category', 'name');

    res.status(200).json(createResponse('success', {
      product: updatedProduct
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
      .populate('customer', 'firstname lastname email')
      .populate('product', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ product: req.params.id });

    res.status(200).json(createResponse('success', {
      reviews,
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
      .populate('items.product', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments({ 'items.product': req.params.id });

    res.status(200).json(createResponse('success', {
      orders,
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
      .populate('customer', 'firstname lastname email')
      .populate('product', 'name');

    if (!review) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('review_not_found')
      });
    }

    res.status(200).json(createResponse('success', { review }));

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
      .populate('items.product', 'name price');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('order_not_found')
      });
    }

    res.status(200).json(createResponse('success', { order }));

  } catch (error) {
    console.error('Get product order by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_order')
    });
  }
};
