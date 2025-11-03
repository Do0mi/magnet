// Business Products Controller - Business Product Management
const Product = require('../../../models/product-model');
const Category = require('../../../models/category-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');

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
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    const formattedProducts = products.map(product => formatProduct(product));

    res.status(200).json(createResponse('success', {
      products: formattedProducts,
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
    await product.populate('owner', 'firstname lastname email role businessInfo.companyName');
    await product.populate('approvedBy', 'firstname lastname email role');

    const formattedProduct = formatProduct(product);

    res.status(200).json(createResponse('success', { product: formattedProduct }));

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

    const { category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments } = req.body;
    let { code } = req.body;

    // Validate required fields
    if (!name || !description || !pricePerUnit || !category) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
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
      status: 'pending', // Business products need approval
      isAllowed: true,
      owner: req.user.id
    });

    await product.save();
    await product.populate('owner', 'firstname lastname email role businessInfo.companyName');
    await product.populate('approvedBy', 'firstname lastname email role');

    const formattedProduct = formatProduct(product);

    res.status(201).json(createResponse('success', {
      product: formattedProduct
    }, getBilingualMessage('product_created_success')));

  } catch (error) {
    console.error('Create product error:', error);
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

    const { category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments } = req.body;
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

    // If updating category, check if it exists and is active
    if (category) {
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

    // Reset status to pending if product is being updated (needs re-approval)
    if (product.status === 'approved') {
      updateFields.status = 'pending';
      updateFields.approvedBy = undefined;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('category', 'name')
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    if (!updatedProduct) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

    const formattedProduct = formatProduct(updatedProduct);

    res.status(200).json(createResponse('success', {
      product: formattedProduct
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

    const deletedProduct = await Product.findByIdAndDelete(req.params.id);

    if (!deletedProduct) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('product_not_found')
      });
    }

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
    )
      .populate('owner', 'firstname lastname email role businessInfo.companyName')
      .populate('approvedBy', 'firstname lastname email role');

    const formattedProduct = formatProduct(updatedProduct);
    res.status(200).json(createResponse('success', {
      product: formattedProduct
    }, getBilingualMessage('product_toggled_success')));

  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_toggle_product')
    });
  }
};
