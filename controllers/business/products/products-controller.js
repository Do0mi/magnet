// Business Products Controller - Business Product Management
const Product = require('../../../models/product-model');
const Category = require('../../../models/category-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse } = require('../../../utils/response-formatters');

// Helper function to validate business permissions
const validateBusinessPermissions = (req, res) => {
  if (req.user.role !== 'business') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// Helper function to check if product belongs to business
const checkProductOwnership = async (productId, businessId) => {
  const product = await Product.findById(productId);
  if (!product) return { product: null, isOwner: false };
  return { product, isOwner: product.owner.toString() === businessId };
};

// GET /api/v1/business/products - Get that business user products
exports.getProducts = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object - only show business's own products
    const filter = { owner: req.user.id };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { productCode: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter)
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
    console.error('Get business products error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_products')
    });
  }
};

// GET /api/v1/business/products/:id - Get product by id
exports.getProductById = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { product, isOwner } = await checkProductOwnership(req.params.id, req.user.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    await product.populate('category', 'name');

    res.status(200).json(createResponse('success', { product }));

  } catch (error) {
    console.error('Get business product by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_product')
    });
  }
};

// POST /api/v1/business/products/product - The business user creates product
exports.createProduct = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const productData = {
      ...req.body,
      owner: req.user.id
    };

    const product = new Product(productData);
    await product.save();

    res.status(201).json(createResponse('success', product, getBilingualMessage('product_created')));
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_product')
    });
  }
};

// PUT /api/v1/business/products/product/:id - The business user updates product
exports.updateProduct = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { product, isOwner } = await checkProductOwnership(req.params.id, req.user.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    const { name, description, price, category, images, specifications, stock, tags } = req.body;
    const updateFields = { updatedAt: Date.now() };

    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (price !== undefined) updateFields.price = price;
    if (category) updateFields.category = category;
    if (images) updateFields.images = images;
    if (specifications) updateFields.specifications = specifications;
    if (stock !== undefined) updateFields.stock = stock;
    if (tags) updateFields.tags = tags;

    // If updating category, check if it exists
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('category_not_found')
        });
      }
    }

    // Reset status to pending if product is being updated (needs re-approval)
    if (product.status === 'approved') {
      updateFields.status = 'pending';
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('category', 'name');

    res.status(200).json(createResponse('success', {
      product: updatedProduct
    }, getBilingualMessage('product_updated_success')));

  } catch (error) {
    console.error('Update business product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_product')
    });
  }
};

// DELETE /api/v1/business/products/product/:id - The business user deletes product
exports.deleteProduct = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { product, isOwner } = await checkProductOwnership(req.params.id, req.user.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(200).json(createResponse('success', null, getBilingualMessage('product_deleted_success')));

  } catch (error) {
    console.error('Delete business product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_product')
    });
  }
};

// PUT /api/v1/business/products/product/:id/toggle - The business user toggles allow/disallow product
exports.toggleProduct = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { product, isOwner } = await checkProductOwnership(req.params.id, req.user.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    if (!isOwner) {
      return res.status(403).json({
        status: 'error',
        message: getBilingualMessage('insufficient_permissions')
      });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isAllowed: !product.isAllowed },
      { new: true, runValidators: true }
    );

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
