const nodemailer = require('nodemailer');

// Create a transporter
const createTransporter = () => {
  // For production, use actual email service configuration from environment variables
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  // Make sure to use Gmail App Password
    },
    tls: {
      // Do not fail on invalid certs
      rejectUnauthorized: false
    }
  });
};

// Generate a random OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Function to send OTP email
const sendOTPEmail = async (to, otp) => {
  try {
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
    
    const info = await transporter.sendMail(mailOptions);
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

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendBusinessApprovalNotification,
  sendBusinessUnderReviewNotification
};
