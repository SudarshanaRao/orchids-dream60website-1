const OTP = require('../models/OTP');
const smsRestService = require('../utils/smsRestService');

/**
 * Standardize mobile number to 91XXXXXXXXXX format
 */
const formatMobile = (num) => {
  if (!num) return num;
  let cleaned = num.toString().replace(/[\s\-\+]/g, '');
  if (!cleaned.startsWith('91') && cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
};

/**
 * Send OTP to a mobile number for signup/verification
 * Body: { username, mobile }
 */
const sendOtp = async (req, res) => {
  try {
    const { username: providedUsername, mobile, reason, user_id } = req.body;

    if (!mobile) {
      return res.status(400).json({ success: false, message: 'Mobile number is required' });
    }

    const formattedMobile = formatMobile(mobile);

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB (expires in 5 mins as per model)
    await OTP.findOneAndUpdate(
      { identifier: formattedMobile, type: 'mobile' },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    let username = providedUsername;
    
    // If reason is Change Mobile and username not provided, try to fetch it using user_id
    if (reason === 'Change Mobile' && !username && user_id) {
      const User = require('../models/user');
      const user = await User.findOne({ user_id });
      if (user) {
        username = user.username;
      }
    }

    const name = username || 'User';
    
    let message;
    let templateId = '1207172612396743269'; // Default login template

    if (reason === 'Change Mobile') {
      message = `Dear ${name}, Use this OTP ${otp} to change your registered mobile number. Valid only for 10 Minutes. Do not share with anyone. – Finpages Tech`;
      templateId = '1207176952069976461'; // MOBILE_CHANGE_OTP template ID
    } else if (reason === 'Forgot Password') {
      message = `Dear ${name}, Your password reset verification code for Dream60 account is ${otp}. This code will expire in 10 minutes. - Finpages Tech`;
      templateId = '1207176908078229051'; // PASSWORD_RESET template ID
    } else {
      // Use the exact requested template for login
      message = `Dear ${name}, use this OTP ${otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech`;
      templateId = '1207176898558880888'; // Using the one from smsService.js
    }
    
    const result = await smsRestService.sendSms(formattedMobile, message, 'FINPGS', {
      templateId
    });

    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'OTP sent successfully',
        data: { mobile: formattedMobile } 
      });
    } else {
      return res.status(500).json({ success: false, message: result.error || 'Failed to send OTP' });
    }
  } catch (error) {
    console.error('Send OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Verify OTP for a mobile number
 * Body: { mobile, otp }
 */
const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ success: false, message: 'Mobile and OTP are required' });
    }

    const formattedMobile = formatMobile(mobile);

    const otpRecord = await OTP.findOne({ identifier: formattedMobile, type: 'mobile' });

    if (!otpRecord) {
      return res.status(400).json({ success: false, message: 'OTP expired or not found' });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Success - delete OTP record so it can't be reused
    await OTP.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Verify OTP Error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  sendOtp,
  verifyOtp
};
