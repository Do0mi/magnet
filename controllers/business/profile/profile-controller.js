// Business Profile Controller - Business Profile Management
const User = require('../../../models/user-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { formatUser, createResponse } = require('../../../utils/response-formatters');

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

// GET /api/v1/business/profile - Get that business user profile
exports.getProfile = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const user = await User.findById(req.user.id);
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
    console.error('Get business profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_get_profile') 
    });
  }
};

// PUT /api/v1/business/profile - Update that business user profile
exports.updateProfile = async (req, res) => {
  try {
    const permissionError = validateBusinessPermissions(req, res);
    if (permissionError) return;

    const { 
      firstname, 
      lastname, 
      phone, 
      country, 
      language, 
      imageUrl,
      businessName,
      businessDescription,
      businessAddress,
      businessPhone,
      businessEmail,
      businessWebsite,
      businessLicense,
      businessType
    } = req.body;

    let updateFields = { updatedAt: Date.now() };

    // Update basic profile fields
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (phone !== undefined) updateFields.phone = phone;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;

    // Update business-specific fields
    if (businessName) updateFields.businessName = businessName;
    if (businessDescription) updateFields.businessDescription = businessDescription;
    if (businessAddress) updateFields.businessAddress = businessAddress;
    if (businessPhone) updateFields.businessPhone = businessPhone;
    if (businessEmail) updateFields.businessEmail = businessEmail;
    if (businessWebsite) updateFields.businessWebsite = businessWebsite;
    if (businessLicense) updateFields.businessLicense = businessLicense;
    if (businessType) updateFields.businessType = businessType;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updateFields,
      { new: true, runValidators: true }
    );

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
    console.error('Update business profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_update_profile') 
    });
  }
};
