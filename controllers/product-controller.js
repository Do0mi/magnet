const Product = require('../models/product-model');
const User = require('../models/user-model');
const generateProductCode = require('../utils/generateProductCode');

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
    res.status(500).json({ status: 'error', message: 'Failed to get products' });
  }
};

// POST /addProductsByBusiness
exports.addProductsByBusiness = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: 'Only business users can add products' });
    }
    let { code, category, name, images, description, color, features, unit, minOrder, pricePerUnit, stock, accessories, customFields } = req.body;
    if (!customFields || !Array.isArray(customFields) || customFields.length < 5 || customFields.length > 10) {
      return res.status(400).json({ status: 'error', message: 'Must provide 5–10 custom fields' });
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
    res.status(201).json({ status: 'success', message: 'Product added and pending approval', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add product' });
  }
};

// POST /addProductsByMagnet_employee
exports.addProductsByMagnetEmployee = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: 'Only magnet_employee can add products' });
    }
    let { code, category, name, images, description, color, features, unit, minOrder, pricePerUnit, stock, accessories, customFields, owner } = req.body;
    if (!customFields || !Array.isArray(customFields) || customFields.length < 5 || customFields.length > 10) {
      return res.status(400).json({ status: 'error', message: 'Must provide 5–10 custom fields' });
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
    res.status(201).json({ status: 'success', message: 'Product added and approved', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add product' });
  }
};

// PUT /products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (req.user.role === 'business') {
      if (product.owner.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to update this product' });
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
      return res.status(403).json({ status: 'error', message: 'Not authorized to update product' });
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
    if (customFields && Array.isArray(customFields) && customFields.length >= 5 && customFields.length <= 10) product.customFields = customFields;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: 'Product updated', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update product' });
  }
};

// DELETE /products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (req.user.role === 'business') {
      if (product.owner.toString() !== req.user.id) {
        return res.status(403).json({ status: 'error', message: 'Not authorized to delete this product' });
      }
    } else if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete product' });
    }
    await product.deleteOne();
    res.status(200).json({ status: 'success', message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
};

// PUT /products/:id/approve
exports.approveProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to approve product' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    product.status = 'approved';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: 'Product approved', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to approve product' });
  }
};

// PUT /products/:id/decline
exports.declineProduct = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'magnet_employee') {
      return res.status(403).json({ status: 'error', message: 'Not authorized to decline product' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    product.status = 'declined';
    product.approvedBy = req.user.id;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: 'Product declined', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to decline product' });
  }
}; 