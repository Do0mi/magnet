// User Controller
const User = require('../models/user-model');
const { sendBusinessApprovalNotification } = require('../utils/email-utils');
const { getBilingualMessage } = require('../utils/messages');

// Middleware dependencies (for validation, role checks, etc.) should remain in the route file

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    res.status(200).json({ status: 'success', data: { user } });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_profile') });
  }
};

exports.updateProfile = async (req, res) => {
  try {
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
    );
    if (!updatedUser) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    res.status(200).json({ status: 'success', message: getBilingualMessage('profile_updated_success'), data: { user: updatedUser } });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_update_profile') });
  }
};

exports.getBusinessRequests = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const query = { role: 'business', 'businessInfo.approvalStatus': status };
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
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_business_requests') });
  }
};

exports.businessApproval = async (req, res) => {
  try {
    const { businessId, status, reason } = req.body;
    const adminId = req.user.id;
    const business = await User.findById(businessId);
    if (!business) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('business_not_found') });
    }
    if (business.role !== 'business') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('user_not_business') });
    }
    business.businessInfo.approvalStatus = status;
    business.businessInfo.isApproved = status === 'approved';
    business.businessInfo.approvedBy = adminId;
    business.businessInfo.approvedAt = new Date();
    if (status === 'rejected' && reason) {
      business.businessInfo.rejectionReason = reason;
    }
    await business.save();
    await sendBusinessApprovalNotification(
      business.email,
      business.businessInfo.companyName,
      status,
      reason
    );
    res.status(200).json({
      status: 'success',
      message: `${getBilingualMessage('business_approved_rejected').en} ${status} ${getBilingualMessage('successfully').en}`,
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
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_process_business_approval') });
  }
};

exports.getBusinessDetails = async (req, res) => {
  try {
    const { businessId } = req.params;
    const business = await User.findById(businessId).select('-password -emailOTP -phoneOTP -passwordResetToken');
    if (!business) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('business_not_found') });
    }
    if (business.role !== 'business') {
      return res.status(400).json({ status: 'error', message: getBilingualMessage('user_not_business') });
    }
    res.status(200).json({ status: 'success', data: { business } });
  } catch (err) {
    console.error('Get business details error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_business_details') });
  }
};

exports.getBusinessProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: getBilingualMessage('user_not_found') });
    }
    if (user.role !== 'business') {
      return res.status(403).json({ status: 'error', message: getBilingualMessage('access_denied_business_profile') });
    }
    res.status(200).json({ status: 'success', data: { business: user } });
  } catch (err) {
    console.error('Get business profile error:', err);
    res.status(500).json({ status: 'error', message: getBilingualMessage('failed_get_business_profile') });
  }
};
