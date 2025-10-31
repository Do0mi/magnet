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

    const { 
      firstname, 
      lastname, 
      country, 
      language, 
      imageUrl,
      // Business info fields
      companyName,
      crNumber,
      vatNumber,
      companyType,
      city,
      district,
      streetName
    } = req.body;

    let updateFields = { updatedAt: Date.now() };

    // Update basic profile fields
    if (firstname) updateFields.firstname = firstname;
    if (lastname) updateFields.lastname = lastname;
    if (country) updateFields.country = country;
    if (language) updateFields.language = language;
    if (imageUrl !== undefined) updateFields.imageUrl = imageUrl;

    // Update business-specific fields
    // Check if we need to update businessInfo fields
    const needsBusinessInfoUpdate = companyName !== undefined || crNumber !== undefined || 
                                     vatNumber !== undefined || companyType !== undefined ||
                                     city !== undefined || district !== undefined || streetName !== undefined;
    
    if (needsBusinessInfoUpdate) {
      const businessInfoUpdate = {};
      
      if (companyName !== undefined) businessInfoUpdate.companyName = companyName;
      if (crNumber !== undefined) businessInfoUpdate.crNumber = crNumber;
      if (vatNumber !== undefined) businessInfoUpdate.vatNumber = vatNumber;
      if (companyType !== undefined) businessInfoUpdate.companyType = companyType;
      
      // Handle address updates - need to get current user to preserve existing values
      if (city !== undefined || district !== undefined || streetName !== undefined) {
        const currentUser = await User.findById(req.user.id).select('businessInfo.address');
        businessInfoUpdate.address = {
          city: city !== undefined ? city : (currentUser?.businessInfo?.address?.city || null),
          district: district !== undefined ? district : (currentUser?.businessInfo?.address?.district || null),
          streetName: streetName !== undefined ? streetName : (currentUser?.businessInfo?.address?.streetName || null)
        };
      }

      // When business user updates their profile, reset approval status to pending
      // and clear approval/rejection metadata
      businessInfoUpdate.approvalStatus = 'pending';
      businessInfoUpdate.approvedBy = null;
      businessInfoUpdate.approvedAt = null;
      businessInfoUpdate.rejectedBy = null;
      businessInfoUpdate.rejectedAt = null;
      businessInfoUpdate.rejectionReason = null;

      // Set businessInfo update fields - Mongoose will handle $set automatically
      updateFields.businessInfo = businessInfoUpdate;
    }

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
    console.error('Update business profile error:', err);
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_update_profile') 
    });
  }
};
