// Dashboard Profile Controller - Admin/Employee Profile Management
const User = require('../../../models/user-model');
const bcrypt = require('bcryptjs');
const { getBilingualMessage } = require('../../../utils/messages');
const { formatUser, createResponse } = require('../../../utils/response-formatters');

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

// GET /api/v1/dashboard/profile - Get the current admin/magnet_employee user profile
exports.getProfile = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const user = await User.findById(req.user.id)
      .populate('businessInfo.approvedBy', 'firstname lastname email role');
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    res.status(200).json(createResponse('success', { 
      user: formatUser(user, { includeBusinessInfo: true }) 
    }));

  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_profile') 
    });
  }
};

// PUT /api/v1/dashboard/profile - Update the current admin/magnet_employee user profile
exports.updateProfile = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    // Get current user to check email and for validation
    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    const { firstname, lastname, email, phone, password, country, language, imageUrl } = req.body || {};
    let updateFields = { updatedAt: Date.now() };

    // Check if email already exists (excluding current user)
    if (email !== undefined && email !== currentUser.email) {
      const existingEmail = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingEmail) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('email_already_registered')
        });
      }
      updateFields.email = email;
    }

    // Check if phone already exists (excluding current user)
    if (phone !== undefined && phone !== currentUser.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: req.user.id } });
      if (existingPhone) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('phone_already_registered')
        });
      }
      updateFields.phone = phone;
    } else if (phone !== undefined) {
      updateFields.phone = phone;
    }

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('password_too_short')
        });
      }
      const salt = await bcrypt.genSalt(10);
      updateFields.password = await bcrypt.hash(password, salt);
    }

    // Update other fields
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    )
      .populate('businessInfo.approvedBy', 'firstname lastname email role');

    if (!updatedUser) {
      return res.status(404).json({ 
        status: 'error', 
        message: getBilingualMessage('user_not_found') 
      });
    }

    res.status(200).json(createResponse('success', 
      { user: formatUser(updatedUser, { includeBusinessInfo: true }) },
      getBilingualMessage('profile_updated_success')
    ));

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_update_profile') 
    });
  }
};
