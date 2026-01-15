// Business Products Controller - Business Product Management
const mongoose = require('mongoose');
const Product = require('../../../models/product-model');
const Category = require('../../../models/category-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatProduct } = require('../../../utils/response-formatters');
const { attachReviewCountsToProducts } = require('../../../utils/review-helpers');
const { getProductsBannerDiscounts, getProductBannerDiscount, applyBannerDiscountToProduct } = require('../../../utils/banner-helpers');

// Base currency for business (always USD)
const BASE_CURRENCY = 'USD';

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
  // Validate that productId is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return { product: null, isOwner: false };
  }
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
    await attachReviewCountsToProducts(products);

    const total = await Product.countDocuments(filter);

    // Get banner discounts for all products
    const productIds = products.map(p => p._id.toString());
    const bannerDiscounts = await getProductsBannerDiscounts(productIds);

    const formattedProducts = await Promise.all(
      products.map(async (product) => {
        const formatted = formatProduct(product);
        const productIdStr = product._id.toString();
        const bannerDiscount = bannerDiscounts[productIdStr];
        
        if (bannerDiscount) {
          return await applyBannerDiscountToProduct(formatted, bannerDiscount, BASE_CURRENCY);
        }
        
        return formatted;
      })
    );

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

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_product_id')
      });
    }

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
    await attachReviewCountsToProducts([product]);
    let formattedProduct = formatProduct(product);

    // Check if product is in a banner and apply discount
    const bannerDiscount = await getProductBannerDiscount(req.params.id);
    if (bannerDiscount) {
      formattedProduct = await applyBannerDiscountToProduct(formattedProduct, bannerDiscount, BASE_CURRENCY);
    }

    res.status(200).json(createResponse('success', { 
      product: formattedProduct,
      currency: BASE_CURRENCY
    }));

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
    await attachReviewCountsToProducts([product]);

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

// PUT /api/v1/business/products/product/:id - The business user updates product
exports.updateProduct = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_product_id')
      });
    }

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

    const { category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments, isAllowed } = req.body;
    const updateFields = { updatedAt: Date.now() };
    let requiresReapproval = false;

    if (category) {
      updateFields.category = category;
      requiresReapproval = true;
    }
    if (name) {
      updateFields.name = name;
      requiresReapproval = true;
    }
    if (images) {
      updateFields.images = images;
      requiresReapproval = true;
    }
    if (description) {
      updateFields.description = description;
      requiresReapproval = true;
    }
    if (unit) {
      updateFields.unit = unit;
      requiresReapproval = true;
    }
    if (minOrder !== undefined) {
      updateFields.minOrder = minOrder;
      requiresReapproval = true;
    }
    if (pricePerUnit) {
      updateFields.pricePerUnit = pricePerUnit;
      requiresReapproval = true;
    }
    if (stock !== undefined) {
      updateFields.stock = stock;
      requiresReapproval = true;
    }
    if (customFields && Array.isArray(customFields) && customFields.length >= 3 && customFields.length <= 10) {
      updateFields.customFields = customFields;
      requiresReapproval = true;
    }
    if (attachments) {
      updateFields.attachments = attachments;
      requiresReapproval = true;
    }
    if (isAllowed !== undefined) {
      updateFields.isAllowed = Boolean(isAllowed);
    }

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
    if (product.status === 'approved' && requiresReapproval) {
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

    await attachReviewCountsToProducts([updatedProduct]);
    const formattedProduct = formatProduct(updatedProduct);

    res.status(200).json(createResponse('success', {
      product: formattedProduct,
      currency: BASE_CURRENCY
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

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_product_id')
      });
    }

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

    // Validate that the ID parameter is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_product_id')
      });
    }

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

    await attachReviewCountsToProducts([updatedProduct]);
    const formattedProduct = formatProduct(updatedProduct);
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

// Helper function to validate a single product data
const validateProductData = (productData, index) => {
  const errors = [];
  const rowNumber = index + 1;

  // Validate required fields
  if (!productData.name || !productData.name.en || !productData.name.ar) {
    errors.push(`Row ${rowNumber}: Name (EN) and Name (AR) are required`);
  }

  if (!productData.category || !productData.category.en || !productData.category.ar) {
    errors.push(`Row ${rowNumber}: Category (EN) and Category (AR) are required`);
  }

  if (!productData.description || !productData.description.en || !productData.description.ar) {
    errors.push(`Row ${rowNumber}: Description (EN) and Description (AR) are required`);
  }

  if (!productData.pricePerUnit) {
    errors.push(`Row ${rowNumber}: Price Per Unit is required`);
  }

  // Validate custom fields
  if (!productData.customFields || !Array.isArray(productData.customFields)) {
    errors.push(`Row ${rowNumber}: Custom fields must be an array`);
  } else {
    if (productData.customFields.length < 3) {
      errors.push(`Row ${rowNumber}: At least 3 custom fields are required`);
    }
    if (productData.customFields.length > 10) {
      errors.push(`Row ${rowNumber}: Maximum 10 custom fields allowed`);
    }

    productData.customFields.forEach((field, fieldIndex) => {
      if (!field.key || !field.key.en || !field.key.ar || !field.value || !field.value.en || !field.value.ar) {
        errors.push(`Row ${rowNumber}, Custom Field ${fieldIndex + 1}: Key and Value must have both EN and AR`);
      }
    });
  }

  // Validate unit if provided
  if (productData.unit) {
    if (!productData.unit.en || !productData.unit.ar) {
      errors.push(`Row ${rowNumber}: If Unit is provided, both EN and AR are required`);
    }
  }

  return errors;
};

// POST /api/v1/business/products/products - Create multiple products (Bulk Create)
exports.createProducts = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { products } = req.body;

    // Validate products array
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('products_array_required')
      });
    }

    if (products.length > 100) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('max_products_limit_exceeded')
      });
    }

    const generateProductCode = require('../../../utils/generateProductCode');
    const createdProducts = [];
    const failedProducts = [];
    const validationErrors = [];

    // Validate all products first
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      const errors = validateProductData(productData, i);
      
      if (errors.length > 0) {
        validationErrors.push(...errors);
        failedProducts.push({
          index: i + 1,
          product: productData.name?.en || productData.name?.ar || 'Unknown',
          errors: errors
        });
      }
    }

    // If all products have validation errors, return early
    if (failedProducts.length === products.length) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('all_products_validation_failed'),
        data: {
          total: products.length,
          failed: failedProducts.length,
          validationErrors: validationErrors,
          failedProducts: failedProducts
        }
      });
    }

    // Process valid products
    for (let i = 0; i < products.length; i++) {
      const productData = products[i];
      
      // Skip if already marked as failed in validation
      if (failedProducts.some(fp => fp.index === i + 1)) {
        continue;
      }

      try {
        // Check if category exists and is active
        const categoryExists = await Category.findOne({
          'name.en': productData.category.en,
          'name.ar': productData.category.ar
        });

        if (!categoryExists) {
          failedProducts.push({
            index: i + 1,
            product: productData.name?.en || productData.name?.ar || 'Unknown',
            error: getBilingualMessage('category_not_found')
          });
          continue;
        }

        if (categoryExists.status !== 'active') {
          failedProducts.push({
            index: i + 1,
            product: productData.name?.en || productData.name?.ar || 'Unknown',
            error: getBilingualMessage('category_inactive')
          });
          continue;
        }

        // Generate product code if not provided
        let code = productData.code;
        if (!code) {
          code = await generateProductCode();
        } else {
          // Check if code already exists
          const existingProduct = await Product.findOne({ code });
          if (existingProduct) {
            // Generate new code if duplicate
            code = await generateProductCode();
          }
        }

        // Create product
        const product = new Product({
          code,
          category: productData.category,
          name: productData.name,
          images: productData.images || [],
          description: productData.description,
          unit: productData.unit,
          minOrder: productData.minOrder,
          pricePerUnit: productData.pricePerUnit,
          stock: productData.stock !== undefined ? productData.stock : 0,
          customFields: productData.customFields,
          attachments: productData.attachments || [],
          status: 'pending', // Business products need approval
          isAllowed: true,
          owner: req.user.id
        });

        await product.save();
        createdProducts.push(product);

      } catch (error) {
        console.error(`Error creating product at index ${i + 1}:`, error);
        failedProducts.push({
          index: i + 1,
          product: productData.name?.en || productData.name?.ar || 'Unknown',
          error: error.message || getBilingualMessage('failed_create_product')
        });
      }
    }

    // Populate created products
    if (createdProducts.length > 0) {
      await Product.populate(createdProducts, [
        { path: 'owner', select: 'firstname lastname email role businessInfo.companyName' },
        { path: 'approvedBy', select: 'firstname lastname email role' }
      ]);
      await attachReviewCountsToProducts(createdProducts);
    }

    const formattedProducts = createdProducts.map(product => formatProduct(product));

    // Build response
    const response = {
      success: createdProducts.length,
      failed: failedProducts.length,
      total: products.length,
      products: formattedProducts
    };

    if (failedProducts.length > 0) {
      response.failedProducts = failedProducts;
    }

    if (validationErrors.length > 0) {
      response.validationErrors = validationErrors;
    }

    // Return success if at least one product was created
    const statusCode = createdProducts.length > 0 ? 201 : 400;
    const status = createdProducts.length > 0 ? 'success' : 'error';
    const message = createdProducts.length > 0
      ? getBilingualMessage('products_created_success')
      : getBilingualMessage('products_creation_failed');

    res.status(statusCode).json(createResponse(status, response, message));

  } catch (error) {
    console.error('Create products error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_create_products')
    });
  }
};
