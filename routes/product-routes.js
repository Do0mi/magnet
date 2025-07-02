const express = require('express');
const router = express.Router();
const Product = require('../models/product-model');
const User = require('../models/user-model');
const { sendBusinessApprovalNotification } = require('../utils/email-utils');
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireAdminEmployeeOrBusiness } = require('../middleware/role-middleware');

// Get all products (public)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isApprove: true }).populate('business', 'email businessInfo.companyName');
    res.status(200).json({ status: 'success', data: { products } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get products' });
  }
});

// Add product (business only, isApprove=false)
router.post('/', verifyToken, requireAdminEmployeeOrBusiness, async (req, res) => {
  try {
    if (req.user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: 'Only business users can add products' });
    }
    const { title, description, image, price, rate, amount, inStock } = req.body;
    const product = new Product({
      title,
      description,
      image,
      price,
      rate,
      amount,
      inStock,
      isApprove: false,
      business: req.user.id
    });
    await product.save();
    res.status(201).json({ status: 'success', message: 'Product added, pending approval', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add product' });
  }
});

// Update product (business only, only own, isApprove=false)
router.put('/:productId', verifyToken, requireAdminEmployeeOrBusiness, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (req.user.role !== 'business' || product.business.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to update this product' });
    }
    const { title, description, image, price, rate, amount, inStock } = req.body;
    product.title = title || product.title;
    product.description = description || product.description;
    product.image = image || product.image;
    product.price = price || product.price;
    product.rate = rate || product.rate;
    product.amount = amount || product.amount;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.isApprove = false;
    product.updatedAt = new Date();
    await product.save();
    res.status(200).json({ status: 'success', message: 'Product updated, pending approval', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update product' });
  }
});

// Product approval (admin/employee only)
router.post('/product-approval', verifyToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { productId, status } = req.body; // status: 'approved' or 'rejected'
    const product = await Product.findById(productId).populate('business');
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    product.isApprove = status === 'approved';
    product.updatedAt = new Date();
    await product.save();
    // Optionally, send email to business about approval/rejection
    await sendBusinessApprovalNotification(
      product.business.email,
      product.title,
      status,
      status === 'rejected' ? 'Your product was rejected.' : undefined
    );
    res.status(200).json({ status: 'success', message: `Product ${status}` });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to process product approval' });
  }
});

// Delete product (business: own, admin/employee: any, send email on delete)
router.delete('/:productId', verifyToken, requireAdminEmployeeOrBusiness, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).populate('business');
    if (!product) return res.status(404).json({ status: 'error', message: 'Product not found' });
    if (req.user.role === 'business' && product.business._id.toString() !== req.user.id) {
      return res.status(403).json({ status: 'error', message: 'Not authorized to delete this product' });
    }
    const businessEmail = product.business.email;
    const businessName = product.business.businessInfo?.companyName || product.business.firstname;
    await product.deleteOne();
    // Send email to business user if deleted by admin/employee
    if (req.user.role !== 'business') {
      await sendBusinessApprovalNotification(
        businessEmail,
        businessName,
        'deleted',
        'Your product has been deleted by Magnet admin/employee.'
      );
    }
    res.status(200).json({ status: 'success', message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to delete product' });
  }
});

module.exports = router; 