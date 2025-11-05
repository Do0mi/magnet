const Product = require('../models/product-model');
const User = require('../models/user-model');
const generateProductCode = require('../utils/generateProductCode');
const { getBilingualMessage } = require('../utils/messages');
const { formatProduct, createResponse } = require('../utils/response-formatters');

// Legacy formatProduct function - now using the one from response-formatters
function legacyFormatProduct(product, language = 'en') {
  return formatProduct(product, { language });
}

// GET /products
exports.getProducts = async (req, res) => {
  try {
    const language = req.query.lang || req.user?.language || 'en';
    
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const status = req.query.status;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query object
    let query = {};
    
    // Status filter - only show approved products to non-admin/business/employee users
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'business' && req.user.role !== 'magnet_employee')) {
      query.status = 'approved';
    } else if (status) {
      // If user has admin privileges and status filter is provided
      if (['pending', 'approved', 'declined'].includes(status)) {
        query.status = status;
      }
    }
    
    // Category filter
    if (category) {
      query['category.en'] = { $regex: category, $options: 'i' };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ar': { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate('owner', 'email businessInfo.companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const formattedProducts = products.map(product => formatProduct(product, { language }));
    
    // Calculate product stats
    const avgRatingResult = await Product.aggregate([
      { $match: query },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    
    const productStats = {
      totalProducts: total,
      byStatus: {
        pending: await Product.countDocuments({ ...query, status: 'pending' }),
        approved: await Product.countDocuments({ ...query, status: 'approved' }),
        declined: await Product.countDocuments({ ...query, status: 'declined' })
      },
      withRatings: await Product.countDocuments({ ...query, rating: { $gt: 0 } }),
      averageRating: avgRatingResult.length > 0 ? Math.round(avgRatingResult[0].avgRating * 100) / 100 : 0
    };
    
    res.status(200).json(createResponse('success', { 
      products: formattedProducts,
      stats: productStats
    }, null, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }));
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_products') });
  }
};

// GET /products/:id
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.lang || req.user?.language || 'en';
    
    const product = await Product.findById(id).populate('owner', 'email businessInfo.companyName');
    
    if (!product) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    }
    
    // Check if user can access this product
    if (product.status !== 'approved' && 
        req.user && 
        req.user.role !== 'admin' && 
        req.user.role !== 'magnet_employee' && 
        req.user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('product_access_denied') });
    }
    
    const formattedProduct = formatProduct(product, { language });
    res.status(200).json(createResponse('success', { product: formattedProduct }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_product') });
  }
};

// POST /addProductsByBusiness
exports.addProductsByBusiness = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('only_business_can_add_products') });
    }
    
    // Check if user is disallowed
    if (req.user.isDisallowed) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('account_disallowed') });
    }
    
    let { code, category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments } = req.body;
    
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
    
    if (!code) {
      code = await generateProductCode();
    }
    
    const product = new Product({
      code,
      category,
      name,
      images,
      description,
      unit,
      minOrder,
      pricePerUnit,
      stock,
      customFields,
      attachments,
      status: 'pending',
      owner: req.user.id,
      rating: req.body.rating !== undefined ? req.body.rating : 0
    });
    
    await product.save();
    res.status(201).json(createResponse('success', 
      { product: formatProduct(product, { language: req.user.language || 'en' }) },
      getBilingualMessage('product_added_pending_approval')
    ));
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_product') });
  }
};

// POST /addProductsByMagnet_employee
exports.addProductsByMagnetEmployee = async (req, res) => {
  try {
    if (!req.user || (req.user.role !== 'magnet_employee' && req.user.role !== 'admin')) {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('only_admin_or_magnet_employee_can_add_products') });
    }
    
    let { code, category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments, owner } = req.body;
    
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
    
    if (!code) {
      code = await generateProductCode();
    }
    
    const product = new Product({
      code,
      category,
      name,
      images,
      description,
      unit,
      minOrder,
      pricePerUnit,
      stock,
      customFields,
      attachments,
      status: 'approved',
      owner,
      approvedBy: req.user.id
    });
    
    await product.save();
    res.status(201).json(createResponse('success', 
      { product: formatProduct(product, { language: req.user.language || 'en' }) },
      getBilingualMessage('product_added_and_approved')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_product') });
  }
};

// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    if (req.user.role === 'business') {
      if (product.owner._id.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_update_product') });
      }
      // Business update: set status to pending
      product.status = 'pending';
      product.approvedBy = undefined;
    } else if (req.user.role === 'magnet_employee' || req.user.role === 'admin') {
      // Admin/magnet_employee can update and optionally approve
      if (req.body.status === 'approved') {
        product.status = 'approved';
        product.approvedBy = req.user.id;
      }
      if (req.body.status === 'declined') {
        product.status = 'declined';
        product.approvedBy = req.user.id;
      }
    } else {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_update_product') });
    }
    const { code, category, name, images, description, unit, minOrder, pricePerUnit, stock, customFields, attachments } = req.body;
    if (code) product.code = code;
    if (category) product.category = category;
    if (name) product.name = name;
    if (images) product.images = images;
    if (description) product.description = description;
    if (unit) product.unit = unit;
    if (minOrder !== undefined) product.minOrder = minOrder;
    if (pricePerUnit) product.pricePerUnit = pricePerUnit;
    if (stock !== undefined) product.stock = stock;
    if (customFields && Array.isArray(customFields) && customFields.length >= 3 && customFields.length <= 10) product.customFields = customFields;
    if (attachments) product.attachments = attachments;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json(createResponse('success', 
      { product: formatProduct(product) },
      getBilingualMessage('product_updated')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_product') });
  }
};

// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    if (req.user.role === 'business') {
      if (product.owner._id.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_product') });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_product') });
    }
    await product.deleteOne();
    res.status(200).json(createResponse('success', null, getBilingualMessage('product_deleted')));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_delete_product') });
  }
};

// PUT /products/:id/approve
exports.approveProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_approve_product') });
    }
    const product = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    product.status = 'approved';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    
    // Re-populate after save to get the updated approvedBy
    const updatedProduct = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    
    res.status(200).json(createResponse('success', 
      { product: formatProduct(updatedProduct) },
      getBilingualMessage('product_approved')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_approve_product') });
  }
};

// PUT /products/:id/decline
exports.declineProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_decline_product') });
    }
    const product = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    product.status = 'declined';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    
    // Re-populate after save to get the updated approvedBy
    const updatedProduct = await Product.findById(req.params.id).populate('owner', 'firstname lastname email businessInfo.companyName').populate('approvedBy', 'firstname lastname email role');
    
    res.status(200).json(createResponse('success', 
      { product: formatProduct(updatedProduct) },
      getBilingualMessage('product_declined')
    ));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_decline_product') });
  }
};

// ===== PUBLIC PRODUCT CONTROLLERS FOR UNAUTHORIZED USERS =====

// GET /public/products - Get all approved products (public access)
exports.getPublicProducts = async (req, res) => {
  try {
    const language = req.query.lang || req.user?.language || 'en';
    
    // Extract query parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;
    const search = req.query.search;
    const minPrice = req.query.minPrice;
    const maxPrice = req.query.maxPrice;
    
    // Calculate skip value for pagination
    const skip = (page - 1) * limit;
    
    // Build query object - ONLY approved products for public access
    let query = {
      status: 'approved' // Always filter for approved products only
    };
    
    // Category filter
    if (category) {
      query['category.en'] = { $regex: category, $options: 'i' };
    }
    
    // Search filter
    if (search) {
      query.$or = [
        { 'name.en': { $regex: search, $options: 'i' } },
        { 'name.ar': { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Price filter
    if (minPrice || maxPrice) {
      query.pricePerUnit = {};
      if (minPrice) {
        query.pricePerUnit.$gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        query.pricePerUnit.$lte = parseFloat(maxPrice);
      }
    }
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Execute query with pagination
    const products = await Product.find(query)
      .populate('owner', 'businessInfo.companyName') // Only show company name, not email
      .select('-owner.email -owner.firstname -owner.lastname -owner.phone') // Hide sensitive user data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const formattedProducts = products.map(product => formatProduct(product, { language }));
    
    // Calculate basic stats (only for approved products)
    const productStats = {
      totalProducts: total,
      averageRating: await Product.aggregate([
        { $match: { status: 'approved', rating: { $gt: 0 } } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ]).then(result => result.length > 0 ? Math.round(result[0].avgRating * 100) / 100 : 0)
    };
    
    res.status(200).json(createResponse('success', { 
      products: formattedProducts,
      stats: productStats
    }, null, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }));
  } catch (err) {
    console.error('Get public products error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_products') });
  }
};

// GET /public/products/:id - Get single approved product (public access)
exports.getPublicProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const language = req.query.lang || req.user?.language || 'en';
    
    const product = await Product.findById(id)
      .populate('owner', 'businessInfo.companyName') // Only show company name
      .select('-owner.email -owner.firstname -owner.lastname -owner.phone'); // Hide sensitive user data
    
    if (!product) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    }
    
    // Only allow access to approved products for public users
    if (product.status !== 'approved') {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    }
    
    const formattedProduct = formatProduct(product, { language });
    res.status(200).json(createResponse('success', { product: formattedProduct }));
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_product') });
  }
};

// GET /public/products/category/:category - Get products by category (public access)
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const language = req.query.lang || req.user?.language || 'en';
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build query for approved products in specific category
    const query = {
      status: 'approved',
      $or: [
        { 'category.en': { $regex: category, $options: 'i' } },
        { 'category.ar': { $regex: category, $options: 'i' } }
      ]
    };
    
    const total = await Product.countDocuments(query);
    
    const products = await Product.find(query)
      .populate('owner', 'businessInfo.companyName')
      .select('-owner.email -owner.firstname -owner.lastname -owner.phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const formattedProducts = products.map(product => formatProduct(product, { language }));
    
    res.status(200).json(createResponse('success', { 
      products: formattedProducts,
      category: category
    }, null, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }));
  } catch (err) {
    console.error('Get products by category error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_products') });
  }
};

// GET /public/products/search - Search products (public access)
exports.searchProducts = async (req, res) => {
  try {
    const { q: searchTerm } = req.query;
    const language = req.query.lang || req.user?.language || 'en';
    
    if (!searchTerm) {
      return res.status(400).json({ status: 'error', message: 'Search term is required' });
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build search query for approved products only
    const query = {
      status: 'approved',
      $or: [
        { 'name.en': { $regex: searchTerm, $options: 'i' } },
        { 'name.ar': { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { 'category.en': { $regex: searchTerm, $options: 'i' } },
        { 'category.ar': { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    const total = await Product.countDocuments(query);
    
    const products = await Product.find(query)
      .populate('owner', 'businessInfo.companyName')
      .select('-owner.email -owner.firstname -owner.lastname -owner.phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const formattedProducts = products.map(product => formatProduct(product, { language }));
    
    res.status(200).json(createResponse('success', { 
      products: formattedProducts,
      searchTerm: searchTerm
    }, null, {
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    }));
  } catch (err) {
    console.error('Search products error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_products') });
  }
}; 