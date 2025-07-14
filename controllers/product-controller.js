const Product = require('../models/product-model');
const User = require('../models/user-model');
const generateProductCode = require('../utils/generateProductCode');
const { getBilingualMessage } = require('../utils/messages');

// GET /products
exports.getProducts = async (req, res) => {
  try {
    let products;
    if (req.user && (req.user.role === 'admin' || req.user.role === 'magnet_employee')) {
      products = await Product.find().populate('owner', 'email businessInfo.companyName');
    } else {
      products = await Product.find({ status: 'approved' }).populate('owner', 'email businessInfo.companyName');
    }
    res.status(200).json({ status: 'success', data: { products } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_products') });
  }
};

// POST /addProductsByBusiness
exports.addProductsByBusiness = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('only_business_can_add_products') });
    }
    let { code, category, name, images, description, color, features, unit, minOrder, pricePerUnit, stock, accessories, customFields } = req.body;
    if (!customFields || !Array.isArray(customFields) || customFields.length < 3 || customFields.length > 10) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_custom_fields_count') });
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
      color,
      features,
      unit,
      minOrder,
      pricePerUnit,
      stock,
      accessories,
      customFields,
      status: 'pending',
      owner: req.user.id
    });
    await product.save();
    res.status(201).json({ status: 'success', message: getBilingualMessage('product_added_pending_approval'), data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_add_product') });
  }
};

// POST /addProductsByMagnet_employee
exports.addProductsByMagnetEmployee = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('only_magnet_employee_can_add_products') });
    }
    let { code, category, name, images, description, color, features, unit, minOrder, pricePerUnit, stock, accessories, customFields, owner } = req.body;
    if (!customFields || !Array.isArray(customFields) || customFields.length < 3 || customFields.length > 10) {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('invalid_custom_fields_count') });
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
      color,
      features,
      unit,
      minOrder,
      pricePerUnit,
      stock,
      accessories,
      customFields,
      status: 'approved',
      owner,
      approvedBy: req.user.id
    });
    await product.save();
    res.status(201).json({ status: 'success', message: getBilingualMessage('product_added_and_approved'), data: { product } });
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
    const { code, category, name, images, description, color, features, unit, minOrder, pricePerUnit, stock, accessories, customFields } = req.body;
    if (code) product.code = code;
    if (category) product.category = category;
    if (name) product.name = name;
    if (images) product.images = images;
    if (description) product.description = description;
    if (color) product.color = color;
    if (features) product.features = features;
    if (unit) product.unit = unit;
    if (minOrder !== undefined) product.minOrder = minOrder;
    if (pricePerUnit) product.pricePerUnit = pricePerUnit;
    if (stock !== undefined) product.stock = stock;
    if (accessories) product.accessories = accessories;
    if (customFields && Array.isArray(customFields) && customFields.length >= 3 && customFields.length <= 10) product.customFields = customFields;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_updated'), data: { product } });
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
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_approved'), data: { product } });
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
    res.status(200).json({ status: 'success', message: getBilingualMessage('product_declined'), data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_decline_product') });
  }
}; 