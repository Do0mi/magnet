// Dashboard Business Controller - Business Management
const User = require('../../../models/user-model');
const { sendBusinessApprovalNotification } = require('../../../utils/email-utils');
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

// GET /api/v1/dashboard/business/businesses - Get all business requests
exports.getBusinesses = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build filter for business users
    const filter = { role: 'business' };
    if (status) {
      filter.businessStatus = status;
    }

    const businesses = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json(createResponse('success', {
      businesses: businesses.map(business => formatUser(business, { includeBusinessInfo: true })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBusinesses: total,
        limit: parseInt(limit)
      }
    }));

  } catch (error) {
    console.error('Get business requests error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_business_requests')
    });
  }
};

// PUT /api/v1/dashboard/business/approve - Approve a business request
exports.approveBusiness = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { businessId } = req.body;

    if (!businessId) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    const business = await User.findById(businessId);
    if (!business || business.role !== 'business') {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('business_not_found')
      });
    }

    const updateFields = { 
      updatedAt: Date.now(),
      businessStatus: 'approved',
      isAllowed: true
    };

    const updatedBusiness = await User.findByIdAndUpdate(
      businessId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    // Send notification email
    try {
      await sendBusinessApprovalNotification(updatedBusiness, 'approve');
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.status(200).json(createResponse('success', {
      business: formatUser(updatedBusiness, { includeBusinessInfo: true })
    }, getBilingualMessage('business_approve_success')));

  } catch (error) {
    console.error('Business approval error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_business_approval')
    });
  }
};

// PUT /api/v1/dashboard/business/decline - Decline a business request
exports.declineBusiness = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { businessId, rejectionReason } = req.body;

    if (!businessId) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('missing_required_fields')
      });
    }

    const business = await User.findById(businessId);
    if (!business || business.role !== 'business') {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('business_not_found')
      });
    }

    const updateFields = { 
      updatedAt: Date.now(),
      businessStatus: 'rejected',
      isAllowed: false
    };

    if (rejectionReason) {
      updateFields.rejectionReason = rejectionReason;
    }

    const updatedBusiness = await User.findByIdAndUpdate(
      businessId,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password');

    // Send notification email
    try {
      await sendBusinessApprovalNotification(updatedBusiness, 'reject', rejectionReason);
    } catch (emailError) {
      console.error('Email notification error:', emailError);
    }

    res.status(200).json(createResponse('success', {
      business: formatUser(updatedBusiness, { includeBusinessInfo: true })
    }, getBilingualMessage('business_decline_success')));

  } catch (error) {
    console.error('Business decline error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_business_decline')
    });
  }
};

// GET /api/v1/dashboard/business/businesses/:id - Get business request by id
exports.getBusinessById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const business = await User.findById(req.params.id)
      .select('-password');

    if (!business || business.role !== 'business') {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('business_not_found')
      });
    }

    res.status(200).json(createResponse('success', {
      business: formatUser(business, { includeBusinessInfo: true })
    }));

  } catch (error) {
    console.error('Get business details error:', error);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_business_details')
    });
  }
};
