const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY || "15b4bfaa",
  apiSecret: process.env.VONAGE_API_SECRET || "0ziqHiKqxkM3CrxZ"
});

// Generate a random OTP code
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS OTP code
const sendOTPSMS = async (phone, otp) => {
  try {
    const from = process.env.VONAGE_BRAND_NAME || "Magnet";
    const text = `Your verification code is: ${otp}. This code will expire in 10 minutes.`;

    const response = await vonage.sms.send({ to: phone, from, text });
    
    // Check if message was sent successfully
    const success = response.messages.every(message => message.status === '0');
    
    if (success) {
      console.log('OTP SMS sent successfully to:', phone);
      return { 
        success: true, 
        messageId: response.messages[0].message_id 
      };
    } else {
      throw new Error('Failed to send SMS');
    }
  } catch (error) {
    console.error('OTP SMS send failed:', {
      error: error.message,
      phone,
      time: new Date().toISOString()
    });
    return { 
      success: false, 
      error: 'Failed to send OTP SMS',
      details: error.message 
    };
  }
};

module.exports = {
  generateOTP,
  sendOTPSMS
};