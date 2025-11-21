const nodemailer = require('nodemailer');

const EMAIL_SEND_TIMEOUT_MS = parseInt(process.env.EMAIL_SEND_TIMEOUT_MS || '10000', 10);
const EMAIL_TRANSPORT_DISABLED = process.env.EMAIL_TRANSPORT_DISABLED === 'true';
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  return ['true', '1', 'yes', 'on'].includes(String(value).toLowerCase());
};

// Create a transporter
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials are not configured');
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '465', 10);
  const secure = parseBoolean(process.env.EMAIL_SECURE, port === 465);
  const requireTLS = parseBoolean(process.env.EMAIL_REQUIRE_TLS, !secure);
  const service = process.env.EMAIL_SERVICE || undefined;

  const transportOptions = {
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Make sure to use Gmail App Password
    },
    connectionTimeout: EMAIL_SEND_TIMEOUT_MS,
    socketTimeout: EMAIL_SEND_TIMEOUT_MS,
    tls: {
      rejectUnauthorized: false
    }
  };

  if (service) {
    transportOptions.service = service;
  }

  if (!secure && requireTLS) {
    transportOptions.requireTLS = true;
  }

  return nodemailer.createTransport(transportOptions);
};

const sendMailWithTimeout = async (transporter, mailOptions) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Email send timeout'));
    }, EMAIL_SEND_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([transporter.sendMail(mailOptions), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    throw error;
  }
};

const logOtpInDevelopment = (channel, identifier, otp) => {
  console.warn(`[OTP][${channel}] Email transport disabled or misconfigured. OTP for ${identifier}: ${otp}`);
};

// Generate a random OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOTPEmail = async (to, otp) => {
  try {
    if (EMAIL_TRANSPORT_DISABLED || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logOtpInDevelopment('email', to, otp);
      return { success: true, simulated: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 20px 0; border-radius: 8px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    console.log('OTP Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('OTP Email send failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send OTP email',
      details: error.response || error.message 
    };
  }
};

// Function to send business approval notification
const sendBusinessApprovalNotification = async (to, companyName, status, reason = null) => {
  try {
    const transporter = createTransporter();
    
    const subject = status === 'approved' 
      ? 'Business Registration Approved' 
      : 'Business Registration Update';
    
    const statusText = status === 'approved' ? 'approved' : 'rejected';
    const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Business Registration ${status === 'approved' ? 'Approved' : 'Update'}</h2>
          <p>Dear Business Owner,</p>
          <p>Your business registration for <strong>${companyName}</strong> has been <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span>.</p>
          ${status === 'rejected' && reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          ${status === 'approved' ? '<p>You can now log in to your account and start using our services.</p>' : '<p>Please review the feedback and resubmit your application if needed.</p>'}
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Business approval notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Business approval notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send business approval notification',
      details: error.response || error.message 
    };
  }
};

// Function to send business registration under review notification
const sendBusinessUnderReviewNotification = async (to, companyName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet Project" <noreply@magnetproject.com>',
      to: to,
      subject: 'Business Registration Under Review',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Business Registration Under Review</h2>
          <p>Dear Business Owner,</p>
          <p>Thank you for registering your business <strong>${companyName}</strong> with Magnet.</p>
          <p>Your application is currently under review by our team. We will notify you once the review is complete.</p>
          <p>This process typically takes 1-3 business days.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Business under review notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Business under review notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send business under review notification',
      details: error.response || error.message 
    };
  }
};

// Function to send new review notification to business user
const sendNewReviewNotification = async (to, businessName, productName, customerName, rating, comment) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'New Review on Your Product',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Review on Your Product</h2>
          <p>Dear ${businessName},</p>
          <p>A customer has left a review on your product <strong>"${productName}"</strong>.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Customer:</strong> ${customerName}</p>
            <p><strong>Rating:</strong> ${rating}/5 ⭐</p>
            ${comment ? `<p><strong>Comment:</strong> "${comment}"</p>` : ''}
          </div>
          <p>You can view and manage all your product reviews in your business dashboard.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('New review notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('New review notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send new review notification',
      details: error.response || error.message 
    };
  }
};

// Function to send review rejection notification
const sendReviewRejectionNotification = async (to, userName, productName, rejectionReason) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Review Rejected',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Review Rejected</h2>
          <p>Dear ${userName},</p>
          <p>Your review for the product <strong>${productName}</strong> has been rejected by our moderation team.</p>
          ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
          <p>Please review our community guidelines and ensure your future reviews comply with our standards.</p>
          <p>If you believe this was an error, please contact our support team.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Review rejection notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Review rejection notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send review rejection notification',
      details: error.response || error.message 
    };
  }
};



// Function to send user disallow notification
const sendUserDisallowNotification = async (to, userName, disallowReason) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Account Access Restricted',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Account Access Restricted</h2>
          <p>Dear ${userName},</p>
          <p>We regret to inform you that your account access has been restricted on our platform.</p>
          <p><strong>Reason:</strong> ${disallowReason}</p>
          <p>If you believe this action was taken in error or if you have any questions, please contact our support team for assistance.</p>
          <p>We appreciate your understanding.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('User disallow notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('User disallow notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send user disallow notification',
      details: error.response || error.message 
    };
  }
};

// Function to send user allow notification
const sendUserAllowNotification = async (to, userName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Account Access Restored',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Account Access Restored</h2>
          <p>Dear ${userName},</p>
          <p>Great news! Your account access has been restored and you can now use our platform normally.</p>
          <p>We apologize for any inconvenience caused and thank you for your patience.</p>
          <p>Welcome back!</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('User allow notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('User allow notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send user allow notification',
      details: error.response || error.message 
    };
  }
};

// Function to send product approval notification
const sendProductApprovalNotification = async (to, userName, productName, approvedBy, approvedAt) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Product Approved',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Product Approved</h2>
          <p>Dear ${userName},</p>
          <p>Great news! Your product <strong>"${productName}"</strong> has been approved and is now live on our platform.</p>
          <p><strong>Approved by:</strong> ${approvedBy}</p>
          <p><strong>Approved at:</strong> ${new Date(approvedAt).toLocaleString()}</p>
          <p>Your product is now visible to customers and ready for orders.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Product approval notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Product approval notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send product approval notification',
      details: error.response || error.message 
    };
  }
};

// Function to send product decline notification
const sendProductDeclineNotification = async (to, userName, productName, declinedBy, declinedAt, reason) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Product Declined',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Product Declined</h2>
          <p>Dear ${userName},</p>
          <p>We regret to inform you that your product <strong>"${productName}"</strong> has been declined.</p>
          <p><strong>Declined by:</strong> ${declinedBy}</p>
          <p><strong>Declined at:</strong> ${new Date(declinedAt).toLocaleString()}</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>Please review the feedback and make necessary changes before resubmitting your product.</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Product decline notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Product decline notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send product decline notification',
      details: error.response || error.message 
    };
  }
};

// Function to send product allow notification
const sendProductAllowNotification = async (to, userName, productName, allowedBy, allowedAt) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Product Allowed',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Product Allowed</h2>
          <p>Dear ${userName},</p>
          <p>Your product <strong>"${productName}"</strong> has been allowed and is now visible to customers.</p>
          <p><strong>Allowed by:</strong> ${allowedBy}</p>
          <p><strong>Allowed at:</strong> ${new Date(allowedAt).toLocaleString()}</p>
          <p>Your product is now active and ready for orders.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Product allow notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Product allow notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send product allow notification',
      details: error.response || error.message 
    };
  }
};

// Function to send product disallow notification
const sendProductDisallowNotification = async (to, userName, productName, disallowedBy, disallowedAt) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Product Disallowed',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Product Disallowed</h2>
          <p>Dear ${userName},</p>
          <p>We regret to inform you that your product <strong>"${productName}"</strong> has been disallowed and is no longer visible to customers.</p>
          <p><strong>Disallowed by:</strong> ${disallowedBy}</p>
          <p><strong>Disallowed at:</strong> ${new Date(disallowedAt).toLocaleString()}</p>
          <p>If you have any questions about this action, please contact our support team.</p>
          <p>Thanks,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Product disallow notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Product disallow notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send product disallow notification',
      details: error.response || error.message 
    };
  }
};

// Function to send applicant application submitted notification
const sendApplicantSubmissionNotification = async (to, applicantName) => {
  try {
    if (EMAIL_TRANSPORT_DISABLED || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email] Application submitted notification to ${to} (simulated)`);
      return { success: true, simulated: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Application Received - Under Review',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Application Received</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for submitting your application to Magnet.</p>
          <p>We have successfully received your application and CV. Our team will review your application and get back to you in a short time.</p>
          <p>We appreciate your interest in joining our team and will contact you soon with an update.</p>
          <p>If you have any questions, please feel free to contact us.</p>
          <p>Best regards,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    console.log('Applicant submission notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Applicant submission notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send applicant submission notification',
      details: error.response || error.message 
    };
  }
};

// Function to send applicant acceptance notification
const sendApplicantAcceptanceNotification = async (to, applicantName) => {
  try {
    if (EMAIL_TRANSPORT_DISABLED || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email] Application accepted notification to ${to} (simulated)`);
      return { success: true, simulated: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Application Accepted - Next Steps',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #28a745;">Congratulations! Your Application Has Been Accepted</h2>
          <p>Dear ${applicantName},</p>
          <p>We are pleased to inform you that your application has been reviewed and accepted by our team.</p>
          <p>Our team will contact you soon to discuss the next steps and provide you with further details.</p>
          <p>We look forward to working with you and welcome you to the Magnet family!</p>
          <p>If you have any questions in the meantime, please don't hesitate to reach out to us.</p>
          <p>Best regards,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    console.log('Applicant acceptance notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Applicant acceptance notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send applicant acceptance notification',
      details: error.response || error.message 
    };
  }
};

// Function to send applicant rejection notification
const sendApplicantRejectionNotification = async (to, applicantName, rejectionReason) => {
  try {
    if (EMAIL_TRANSPORT_DISABLED || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(`[Email] Application rejected notification to ${to} (simulated)`);
      return { success: true, simulated: true };
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || '"Magnet" <noreply@magnetproject.com>',
      to: to,
      subject: 'Application Update',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc3545;">Application Update</h2>
          <p>Dear ${applicantName},</p>
          <p>Thank you for your interest in joining Magnet and for taking the time to submit your application.</p>
          <p>After careful consideration, we regret to inform you that we are unable to proceed with your application at this time.</p>
          ${rejectionReason ? `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Reason:</strong> ${rejectionReason}</p>
          </div>` : ''}
          <p>We sincerely apologize for any inconvenience and appreciate your understanding. We encourage you to apply again in the future as our needs may change.</p>
          <p>We wish you the best of luck in your career endeavors.</p>
          <p>Best regards,<br>The Magnet Team</p>
        </div>
      `
    };
    
    const info = await sendMailWithTimeout(transporter, mailOptions);
    console.log('Applicant rejection notification sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Applicant rejection notification failed:', {
      error: error.message,
      to,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send applicant rejection notification',
      details: error.response || error.message 
    };
  }
};


module.exports = {
  generateOTP,
  sendOTPEmail,
  sendBusinessApprovalNotification,
  sendBusinessUnderReviewNotification,
  sendNewReviewNotification,
  sendReviewRejectionNotification,
  sendUserDisallowNotification,
  sendUserAllowNotification,
  sendProductApprovalNotification,
  sendProductDeclineNotification,
  sendProductAllowNotification,
  sendProductDisallowNotification,
  sendApplicantSubmissionNotification,
  sendApplicantAcceptanceNotification,
  sendApplicantRejectionNotification
};
