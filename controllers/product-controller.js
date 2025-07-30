const Product = require('../models/product-model');
const User = require('../models/user-model');
const generateProductCode = require('../utils/generateProductCode');
const { getBilingualMessage } = require('../utils/messages');

// Helper to format product with owner company name and language support
function formatProduct(product, language = 'en') {
  const obj = product.toObject();
  obj.ownerCompanyName = obj.owner && obj.owner.businessInfo ? obj.owner.businessInfo.companyName : null;
  delete obj.owner;
  
  // Convert bilingual fields to single language if language is specified
  if (language && language !== 'both') {
    if (obj.name) {
      obj.name = obj.name[language] || obj.name.en;
    }
    if (obj.description) {
      obj.description = obj.description[language] || obj.description.en;
    }
    if (obj.category) {
      obj.category = obj.category[language] || obj.category.en;
    }
    if (obj.unit) {
      obj.unit = obj.unit[language] || obj.unit.en;
    }
    if (obj.customFields) {
      obj.customFields = obj.customFields.map(field => ({
        key: field.key[language] || field.key.en,
        value: field.value[language] || field.value.en
      }));
    }
  }
  
  return obj;
}

// GET /products
exports.getProducts = async (req, res) => {
  try {
    let products;
    const language = req.query.lang || req.user?.language || 'en';
    
    if (req.user && (req.user.role === 'admin' || req.user.role === 'business' || req.user.role === 'magnet_employee')) {
      products = await Product.find().populate('owner', 'email businessInfo.companyName');
    } else {
      products = await Product.find({ status: 'approved' }).populate('owner', 'email businessInfo.companyName');
    }
    
    const formattedProducts = products.map(product => formatProduct(product, language));
    res.status(200).json({ status: 'success', data: { products: formattedProducts } });
  } catch (err) {
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
    
    const formattedProduct = formatProduct(product, language);
    res.status(200).json({ status: 'success', data: { product: formattedProduct } });
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
    res.status(201).json({ 
      status: 'success', 
      message: getBilingualMessage('product_added_pending_approval'), 
      data: { product: formatProduct(product, req.user.language || 'en') } 
    });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_product') });
  }
};

// POST /addProductsByMagnet_employee
exports.addProductsByMagnetEmployee = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('only_magnet_employee_can_add_products') });
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
    res.status(201).json({ 
      status: 'success', 
      message: getBilingualMessage('product_added_and_approved'), 
      data: { product: formatProduct(product, req.user.language || 'en') } 
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_product') });
  }
};

// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    if (req.user.role === 'business') {
      if (product.owner.toString() !== req.user.id) {
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
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_updated'), data: { product: formatProduct(product) } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_product') });
  }
};

// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    if (req.user.role === 'business') {
      if (product.owner.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_product') });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('not_authorized_delete_product') });
    }
    await product.deleteOne();
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_deleted') });
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    product.status = 'approved';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_approved'), data: { product: formatProduct(product) } });
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
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: getBilingualMessage('product_not_found') });
    product.status = 'declined';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_declined'), data: { product: formatProduct(product) } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_decline_product') });
  }
}; 