// User Applicants Controller - Applicant Application Management
const Applicant = require('../../../models/applicant-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatApplicant } = require('../../../utils/response-formatters');
const { sendApplicantSubmissionNotification } = require('../../../utils/email-utils');

// POST /api/v1/user/applicants - Submit an application
exports.submitApplication = async (req, res) => {
  try {
    const { name, email, age, gender } = req.body;
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

    if (!age || isNaN(age) || age < 1 || age > 150) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_age')
      });
    }

    if (!gender || !['male', 'female'].includes(gender)) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('invalid_gender')
      });
    }

    // Validate CV file
    if (!cvFile) {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('cv_required')
      });
    }

    if (cvFile.mimetype !== 'application/pdf') {
      return res.status(400).json({
        status: 'error',
        message: getBilingualMessage('cv_must_be_pdf')
      });
    }

    // Check if applicant with this email already exists (case-insensitive check)
    const trimmedEmail = email.trim();
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
    const applicant = new Applicant({
      name: name.trim(),
      email: trimmedEmail,
      age: parseInt(age),
      gender,
      cv: cvFile.buffer,
      cvContentType: cvFile.mimetype,
      status: 'pending'
    });

    await applicant.save();

    const formattedApplicant = formatApplicant(applicant);

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
    console.error('Submit application error:', err);
    
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

