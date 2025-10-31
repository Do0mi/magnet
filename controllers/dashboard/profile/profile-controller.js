// Dashboard Profile Controller - Admin/Employee Profile Management
const User = require('../../../models/user-model');
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

    const { firstname, lastname, phone, country, language, imageUrl } = req.body;
    let updateFields = { updatedAt: Date.now() };

    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (phone !== undefined) updateFields.phone = phone;
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
