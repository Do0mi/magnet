// User Profile Controller - User Profile Management
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { formatUser, createResponse } = require('../../../utils/response-formatters');

// Helper function to validate customer permissions
const validateCustomerPermissions = (req, res) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ 
      status: 'error', 
      message: getBilingualMessage('insufficient_permissions') 
    });
  }
  return null;
};

// GET /api/v1/user/profile - Get current user profile (Customer)
exports.getProfile = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
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

// PUT /api/v1/user/profile - Update user profile (Customer)
exports.updateProfile = async (req, res) => {
  try {
    const permissionError = validateCustomerPermissions(req, res);
    if (permissionError) return;

    // Email and phone cannot be updated through profile endpoint
    if (req.body.email !== undefined || req.body.phone !== undefined) {
      return res.status(400).json({
        status: 'error',
        message: {
          en: 'Email and phone cannot be updated through profile endpoint',
          ar: 'لا يمكن تحديث البريد الإلكتروني والهاتف من خلال نقطة نهاية الملف الشخصي'
        }
      });
    }

    const { firstname, lastname, country, language, imageUrl } = req.body;
    let updateFields = { updatedAt: Date.now() };

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
