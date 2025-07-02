const express = require('express');
const router = express.Router();
const User = require('../models/user-model');
const bcrypt = require('bcryptjs');
const { sendBusinessApprovalNotification } = require('../utils/email-utils');

// Middleware
const verifyToken = require('../middleware/auth-middleware');
const { requireAdminOrEmployee, requireAdminEmployeeOrBusiness, requireCustomer } = require('../middleware/role-middleware');
const { validateUpdateProfile, validateBusinessApproval } = require('../middleware/validation-middleware');

// Get current user profile
router.get('/profile', verifyToken, requireCustomer, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get profile' 
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, requireCustomer, validateUpdateProfile, async (req, res) => {
  try {
    const { firstname, lastname, email, phone, country, language } = req.body;

    // Initialize update fields
    let updateFields = { 
      updatedAt: Date.now() 
    };

    // Add fields only if they are provided
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;

    // Handle email update with duplicate check
    if (email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: 'Email already exists'
        });
      }
      updateFields.email = email;
      updateFields.isEmailVerified = false; // Reset verification when email changes
    }

    // Handle phone update with duplicate check
    if (phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existingPhone) {
        return res.status(400).json({
          status: 'error',
          message: 'Phone number already exists'
        });
      }
      updateFields.phone = phone;
      updateFields.isPhoneVerified = false; // Reset verification when phone changes
    }

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update profile' 
    });
  }
});

// Get all business registration requests (Admin/Magnet Employee only)
router.get('/business-requests', verifyToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    
    const query = { 
      role: 'business',
      'businessInfo.approvalStatus': status 
    };

    const skip = (page - 1) * limit;
    
    const businesses = await User.find(query)
      .select('-password -emailOTP -phoneOTP -passwordResetToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      data: {
        businesses,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (err) {
    console.error('Get business requests error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get business requests' 
    });
  }
});

// Approve/Reject business registration (Admin/Magnet Employee only)
router.post('/business-approval', verifyToken, requireAdminOrEmployee, validateBusinessApproval, async (req, res) => {
  try {
    const { businessId, status, reason } = req.body;
    const adminId = req.user.id;

    // Find the business
    const business = await User.findById(businessId);
    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business not found'
      });
    }

    if (business.role !== 'business') {
      return res.status(400).json({
        status: 'error',
        message: 'User is not a business'
      });
    }

    // Update business approval status
    business.businessInfo.approvalStatus = status;
    business.businessInfo.isApproved = status === 'approved';
    business.businessInfo.approvedBy = adminId;
    business.businessInfo.approvedAt = new Date();
    
    if (status === 'rejected' && reason) {
      business.businessInfo.rejectionReason = reason;
    }

    await business.save();

    // Send notification email to business
    await sendBusinessApprovalNotification(
      business.email, 
      business.businessInfo.companyName, 
      status, 
      reason
    );

    res.status(200).json({
      status: 'success',
      message: `Business ${status} successfully`,
      data: {
        business: {
          id: business._id,
          companyName: business.businessInfo.companyName,
          approvalStatus: business.businessInfo.approvalStatus,
          isApproved: business.businessInfo.isApproved
        }
      }
    });
  } catch (err) {
    console.error('Business approval error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to process business approval' 
    });
  }
});

// Get business details by ID (Admin/Magnet Employee only)
router.get('/business/:businessId', verifyToken, requireAdminOrEmployee, async (req, res) => {
  try {
    const { businessId } = req.params;

    const business = await User.findById(businessId)
      .select('-password -emailOTP -phoneOTP -passwordResetToken');

    if (!business) {
      return res.status(404).json({
        status: 'error',
        message: 'Business not found'
      });
    }

    if (business.role !== 'business') {
      return res.status(400).json({
        status: 'error',
        message: 'User is not a business'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { business }
    });
  } catch (err) {
    console.error('Get business details error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get business details' 
    });
  }
});

// Get business profile (Business users only)
router.get('/business-profile', verifyToken, requireAdminEmployeeOrBusiness, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }

    if (user.role !== 'business') {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied. Business profile only.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { business: user }
    });
  } catch (err) {
    console.error('Get business profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to get business profile' 
    });
  }
});

// Favourites APIs (customer only)
router.post('/favourites/:productId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can add favourites' });
    }
    const user = await User.findById(req.user.id);
    if (!user.favourites.includes(req.params.productId)) {
      user.favourites.push(req.params.productId);
      await user.save();
    }
    res.status(200).json({ status: 'success', message: 'Product added to favourites' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add to favourites' });
  }
});

router.delete('/favourites/:productId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can remove favourites' });
    }
    const user = await User.findById(req.user.id);
    user.favourites = user.favourites.filter(pid => pid.toString() !== req.params.productId);
    await user.save();
    res.status(200).json({ status: 'success', message: 'Product removed from favourites' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to remove from favourites' });
  }
});

router.get('/favourites', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can view favourites' });
    }
    const user = await User.findById(req.user.id).populate('favourites');
    res.status(200).json({ status: 'success', data: { favourites: user.favourites } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get favourites' });
  }
});

// Cart APIs (customer only)
router.post('/cart', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can add to cart' });
    }
    const { productId, quantity } = req.body;
    const user = await User.findById(req.user.id);
    const cartItem = user.cart.find(item => item.product.toString() === productId);
    if (cartItem) {
      cartItem.quantity += quantity || 1;
    } else {
      user.cart.push({ product: productId, quantity: quantity || 1 });
    }
    await user.save();
    res.status(200).json({ status: 'success', message: 'Product added to cart' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to add to cart' });
  }
});

router.delete('/cart/:productId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can remove from cart' });
    }
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(item => item.product.toString() !== req.params.productId);
    await user.save();
    res.status(200).json({ status: 'success', message: 'Product removed from cart' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to remove from cart' });
  }
});

router.put('/cart/:productId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can update cart' });
    }
    const { quantity } = req.body;
    const user = await User.findById(req.user.id);
    const cartItem = user.cart.find(item => item.product.toString() === req.params.productId);
    if (!cartItem) {
      return res.status(404).json({ status: 'error', message: 'Product not in cart' });
    }
    cartItem.quantity = quantity;
    await user.save();
    res.status(200).json({ status: 'success', message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to update cart' });
  }
});

router.get('/cart', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ status: 'error', message: 'Only customers can view cart' });
    }
    const user = await User.findById(req.user.id).populate('cart.product');
    res.status(200).json({ status: 'success', data: { cart: user.cart } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Failed to get cart' });
  }
});

module.exports = router;
