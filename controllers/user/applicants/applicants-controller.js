// User Applicants Controller - Applicant Application Management
const Applicant = require('../../../models/applicant-model');
const { getBilingualMessage } = require('../../../utils/messages');
const { createResponse, formatApplicant } = require('../../../utils/response-formatters');
const { sendApplicantSubmissionNotification } = require('../../../utils/email-utils');

// POST /api/v1/user/applicants - Submit an application
exports.submitApplication = async (req, res) => {
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
      email: email.trim().toLowerCase(),
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

