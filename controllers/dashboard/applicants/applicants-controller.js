// Dashboard Applicants Controller - Admin/Employee Applicant Management
const Applicant = require('../../../models/applicant-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatApplicant } = require('../../../utils/response-formatters');
const { 
  sendApplicantSubmissionNotification,
  sendApplicantAcceptanceNotification, 
  sendApplicantRejectionNotification 
} = require('../../../utils/email-utils');

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

// GET /api/v1/dashboard/applicants - Get all applicants
exports.getApplicants = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } },
        { studySituation: { $regex: search, $options: 'i' } }
      ];
    }

    const applicants = await Applicant.find(filter)
      .populate('reviewedBy', 'firstname lastname email role')
      .select('-cv') // Exclude CV buffer from list to reduce payload size
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Applicant.countDocuments(filter);
    const formattedApplicants = applicants.map(applicant => formatApplicant(applicant));

    res.status(200).json(createResponse('success', {
      applicants: formattedApplicants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalApplicants: total,
        limit: parseInt(limit)
      }
    }));
  } catch (err) {
    console.error('Get applicants error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_applicants')
    });
  }
};

// GET /api/v1/dashboard/applicants/:id - Get applicant by id
exports.getApplicantById = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const applicant = await Applicant.findById(req.params.id)
      .select('-cv') // Exclude CV buffer to reduce payload size
      .populate('reviewedBy', 'firstname lastname email role');

    if (!applicant) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('applicant_not_found')
      });
    }

    const formattedApplicant = formatApplicant(applicant);
    res.status(200).json(createResponse('success', { applicant: formattedApplicant }));
  } catch (err) {
    console.error('Get applicant by ID error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_applicant')
    });
  }
};

// GET /api/v1/dashboard/applicants/:id/cv - Get applicant CV
exports.getApplicantCV = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const applicant = await Applicant.findById(req.params.id).select('cv cvContentType name');

    if (!applicant) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('applicant_not_found')
      });
    }

    if (!applicant.cv) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('cv_not_found')
      });
    }

    res.setHeader('Content-Type', applicant.cvContentType || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${applicant.name}_CV.pdf"`);
    res.send(applicant.cv);
  } catch (err) {
    console.error('Get applicant CV error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_get_cv')
    });
  }
};

// PUT /api/v1/dashboard/applicants/:id/status - Update applicant status
exports.updateApplicantStatus = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const { status, rejectionReason } = req.body;
    const applicantId = req.params.id;

    // Validate status
    if (!status || !['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_status')
      });
    }

    // Validate rejection reason if status is rejected
    if (status === 'rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('rejection_reason_required')
      });
    }

    const updateData = {
      status,
      reviewedBy: req.user.id,
      reviewedAt: Date.now(),
      updatedAt: Date.now()
    };

    // Add rejection reason if status is rejected
    if (status === 'rejected') {
      updateData.rejectionReason = rejectionReason.trim();
    } else {
      updateData.rejectionReason = undefined;
    }

    // Get the old status before updating
    const oldApplicant = await Applicant.findById(applicantId);
    if (!oldApplicant) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('applicant_not_found')
      });
    }

    const oldStatus = oldApplicant.status;

    const applicant = await Applicant.findByIdAndUpdate(
      applicantId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('reviewedBy', 'firstname lastname email role');

    if (!applicant) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('applicant_not_found')
      });
    }

    // Send email notification if status changed to accepted or rejected
    if (oldStatus !== status) {
      try {
        if (status === 'accepted') {
          await sendApplicantAcceptanceNotification(applicant.email, applicant.name);
          console.log('Applicant acceptance notification email sent successfully');
        } else if (status === 'rejected') {
          await sendApplicantRejectionNotification(applicant.email, applicant.name, rejectionReason);
          console.log('Applicant rejection notification email sent successfully');
        }
      } catch (emailError) {
        console.error('Failed to send applicant status notification email:', emailError);
        // Don't fail the request if email fails
      }
    }

    const formattedApplicant = formatApplicant(applicant);

    res.status(200).json(createResponse('success', {
      applicant: formattedApplicant
    }, getBilingualMessage('applicant_status_updated')));
  } catch (err) {
    console.error('Update applicant status error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_update_applicant_status')
    });
  }
};

// POST /api/v1/dashboard/applicants - Add/Submit an application (with authorization)
exports.addApplicant = async (req, res) => {
  try {
    const { name, email, birthdate, studySituation, gender, phone, city, country, links } = req.body;
    const cvFile = req.file;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('name_required')
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('email_required')
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_email')
      });
    }

    // Validate birthdate
    if (!birthdate) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('birthdate_required')
      });
    }

    const birthdateDate = new Date(birthdate);
    if (isNaN(birthdateDate.getTime())) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_birthdate')
      });
    }

    // Validate that birthdate is not in the future
    if (birthdateDate > new Date()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('birthdate_cannot_be_future')
      });
    }

    // Validate gender
    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_gender')
      });
    }

    // Validate phone number
    if (!phone || !phone.trim()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('phone_required')
      });
    }

    // Basic phone validation (international format)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    const cleanedPhone = phone.trim().replace(/[\s-]/g, '');
    if (!phoneRegex.test(cleanedPhone)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('phone_valid_required')
      });
    }

    // Validate city
    if (!city || !city.trim()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('city_required')
      });
    }

    // Validate country
    if (!country || !country.trim()) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('country_required')
      });
    }

    // Validate CV file if provided
    if (cvFile && cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('cv_must_be_pdf')
      });
    }

    // Validate links if provided
    let processedLinks = [];
    if (links !== undefined && links !== null) {
      // Handle both array and string (single link) inputs
      const linksArray = Array.isArray(links) ? links : (typeof links === 'string' ? [links] : []);
      
      // Filter out empty strings and trim
      processedLinks = linksArray
        .filter(link => link && typeof link === 'string' && link.trim())
        .map(link => link.trim())
        .slice(0, 5); // Limit to 5 links
      
      if (linksArray.length > 5) {
        return res.status(400).json({
          status: 'error',
          message: getBilingualMessage('max_links_exceeded') || 'Maximum 5 links allowed'
        });
      }
    }

    // Check if applicant with this email already exists (case-insensitive check)
    const trimmedEmail = email.trim().toLowerCase();
    const existingApplicant = await Applicant.findOne({ 
      email: new RegExp(`^${trimmedEmail}$`, 'i')
    });
    
    if (existingApplicant) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('already_applied')
      });
    }

    // Create applicant
    const applicantData = {
      name: name.trim(),
      email: trimmedEmail,
      birthdate: birthdateDate,
      studySituation: studySituation ? studySituation.trim() : undefined,
      gender,
      phone: cleanedPhone,
      city: city.trim(),
      country: country.trim(),
      links: processedLinks,
      status: 'pending',
      has_cv: !!cvFile
    };

    // Only add CV data if CV file is uploaded
    if (cvFile) {
      applicantData.cv = cvFile.buffer;
      applicantData.cvContentType = cvFile.mimetype;
    }

    const applicant = new Applicant(applicantData);

    await applicant.save();

    // Populate reviewedBy if needed
    const populatedApplicant = await Applicant.findById(applicant._id)
      .populate('reviewedBy', 'firstname lastname email role');

    const formattedApplicant = formatApplicant(populatedApplicant);

    // Send email notification to applicant
    try {
      await sendApplicantSubmissionNotification(applicant.email, applicant.name);
      console.log('Applicant submission notification email sent successfully');
    } catch (emailError) {
      console.error('Failed to send applicant submission notification email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json(createResponse('success', 
      { applicant: formattedApplicant },
      getBilingualMessage('application_submitted_success')
    ));
  } catch (err) {
    console.error('Add applicant error:', err);
    
    // Handle duplicate email error from MongoDB unique index
    if (err.code === 11000 || err.code === 11001) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('already_applied')
      });
    }
    
    res.status(500).json({ 
      status: 'error', 
      message: getBilingualMessage('failed_submit_application') 
    });
  }
};

// DELETE /api/v1/dashboard/applicants/:id - Delete applicant
exports.deleteApplicant = async (req, res) => {
  try {
    const permissionError = validateAdminOrEmployeePermissions(req, res);
    if (permissionError) return;

    const applicant = await Applicant.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        status: 'error',
        message: getBilingualMessage('applicant_not_found')
      });
    }

    await applicant.deleteOne();

    res.status(200).json(createResponse('success', null, getBilingualMessage('applicant_deleted')));
  } catch (err) {
    console.error('Delete applicant error:', err);
    res.status(500).json({
      status: 'error',
      message: getBilingualMessage('failed_delete_applicant')
    });
  }
};

