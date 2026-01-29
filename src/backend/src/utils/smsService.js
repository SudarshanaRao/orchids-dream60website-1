const axios = require('axios');

const SMS_API_URL = 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';
const SMS_BALANCE_URL = 'https://api.smscountry.com/SMSCwebservice_User_GetBal.asp';
const SMS_REPORTS_URL = 'https://api.smscountry.com/smscwebservices_bulk_reports.aspx';

const client = axios.create({
  timeout: 15000,
});

const smsRestService = require('./smsRestService');

const getSmsConfig = () => ({
  user: process.env.SMSCOUNTRY_USER,
  passwd: process.env.SMSCOUNTRY_PASSWORD,
  sid: process.env.SMSCOUNTRY_SENDER_ID || 'FINPGS',
});

const sendSms = async (mobileNumbers, message, options = {}) => {
  try {
    // Switch to REST API as requested by user
    if (smsRestService.isConfigured()) {
      const numbers = Array.isArray(mobileNumbers) ? mobileNumbers : mobileNumbers.split(',');
      
      // If single number, use sendSms
      if (numbers.length === 1) {
        return await smsRestService.sendSms(numbers[0], message, options.senderId, options);
      } else {
        // For multiple, use bulk
        return await smsRestService.sendBulkSms(numbers, message, options.senderId, options);
      }
    }

    // Fallback to legacy API if REST not configured (though user wants REST)
    const config = getSmsConfig();
    
    if (!config.user || !config.passwd) {
      console.error('SmsCountry credentials not configured');
      return { success: false, error: 'SMS service not configured' };
    }

    const numbers = Array.isArray(mobileNumbers) ? mobileNumbers.join(',') : mobileNumbers;
    
    const formattedNumbers = numbers.split(',').map(num => {
      let cleaned = num.replace(/[\s\-\+]/g, '');
      if (!cleaned.startsWith('91') && cleaned.length === 10) {
        cleaned = '91' + cleaned;
      }
      return cleaned;
    }).join(',');

    const params = {
      user: config.user,
      passwd: config.passwd,
      mobilenumber: formattedNumbers,
      message: message,
      sid: options.senderId || config.sid,
      mtype: options.unicode ? 'OL' : 'N',
      DR: options.deliveryReport !== false ? 'Y' : 'N',
    };

    if (options.templateId) {
      params.templateid = options.templateId;
    }

    const response = await client.get(SMS_API_URL, { params });
    const responseText = response.data?.trim() || '';

    if (responseText.startsWith('OK:')) {
      const jobId = responseText.split(':')[1];
      return { success: true, jobId, response: responseText };
    } else if (responseText.startsWith('ERROR:')) {
      const errorCode = responseText.split(':')[1] || 'Unknown';
      return { success: false, error: `SMS Error: ${errorCode}`, response: responseText };
    }
    
    return { success: false, error: 'Invalid response from SMS provider', response: responseText };
  } catch (error) {
    console.error('SMS Send Error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendBulkSms = async (recipients, message, options = {}) => {
  try {
    const batchSize = 500;
    const results = [];
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const result = await sendSms(batch, message, options);
      results.push({
        batch: Math.floor(i / batchSize) + 1,
        count: batch.length,
        ...result
      });
      
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      success: successful > 0,
      totalBatches: results.length,
      successfulBatches: successful,
      failedBatches: failed,
      results
    };
  } catch (error) {
    console.error('Bulk SMS Error:', error.message);
    return { success: false, error: error.message };
  }
};

const getBalance = async () => {
  try {
    // Try REST API first if configured
    if (smsRestService.isConfigured()) {
      const result = await smsRestService.getBalance();
      if (result.success) return result;
    }

    const config = getSmsConfig();
    
    if (!config.user || !config.passwd) {
      return { success: false, error: 'SMS service not configured' };
    }

    const response = await client.get(SMS_BALANCE_URL, {
      params: {
        User: config.user,
        passwd: config.passwd,
      }
    });
    
    const balanceText = response.data?.toString().trim() || '0';
    if (balanceText.includes('ERROR')) {
      return { success: false, error: balanceText };
    }
    
    const balance = parseFloat(balanceText) || 0;
    return { success: true, balance };
  } catch (error) {
    console.error('Get SMS Balance Error:', error.message);
    return { success: false, error: error.message };
  }
};

const getDeliveryReports = async (fromDate, toDate) => {
  try {
    // Try REST API first if configured
    if (smsRestService.isConfigured()) {
      return await smsRestService.getDetailedReports({ 
        FromDate: fromDate, 
        ToDate: toDate 
      });
    }

    const config = getSmsConfig();
    
    if (!config.user || !config.passwd) {
      return { success: false, error: 'SMS service not configured' };
    }

    const response = await client.get(SMS_REPORTS_URL, {
      params: {
        user: config.user,
        passwd: config.passwd,
        fromdate: fromDate,
        todate: toDate,
      }
    });
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get Delivery Reports Error:', error.message);
    return { success: false, error: error.message };
  }
};

const SMS_TEMPLATES = {
  AUCTION_REMINDER: {
    id: 'auction_reminder',
    name: 'Auction Reminder',
    template: 'Hi {username}! The auction "{auctionName}" starts in {minutes} minutes. Get ready to bid! - Dream60',
    variables: ['username', 'auctionName', 'minutes'],
  },
  ROUND_ADVANCE: {
    id: 'round_advance',
    name: 'Round Advance Notification',
    template: 'Congrats {username}! You advanced to Round {round} in "{auctionName}". Keep bidding! - Dream60',
    variables: ['username', 'round', 'auctionName'],
  },
  ELIMINATION: {
    id: 'elimination',
    name: 'Elimination Notification',
    template: 'Hi {username}, you were eliminated in Round {round} of "{auctionName}". Better luck next time! - Dream60',
    variables: ['username', 'round', 'auctionName'],
  },
  WINNER: {
    id: 'winner',
    name: 'Winner Notification',
    template: 'Congratulations {username}! You won "{auctionName}" with a prize of Rs.{prizeAmount}! Claim now at Dream60. - Dream60',
    variables: ['username', 'auctionName', 'prizeAmount'],
  },
  CLAIM_REMINDER: {
    id: 'claim_reminder',
    name: 'Claim Reminder',
    template: 'Hi {username}! Your prize of Rs.{prizeAmount} from "{auctionName}" is waiting. Claim before it expires! - Dream60',
    variables: ['username', 'prizeAmount', 'auctionName'],
  },
  PROMOTIONAL: {
    id: 'promotional',
    name: 'Promotional Message',
    template: '{message}',
    variables: ['message'],
  },
  CUSTOM: {
    id: 'custom',
    name: 'Custom Message',
    template: '{message}',
    variables: ['message'],
  },
  OTP_VERIFICATION: {
    id: 'otp_verification',
    name: 'OTP Verification',
    template: 'Dear {name}, use this OTP {otp} to login to your Dream60 Account. Its only valid for 10 minutes - Finpages Tech ',
    variables: ['name', 'otp'],
    templateId: '1207176898558880888'
  },
  WELCOME_SMS: {
    id: 'welcome_sms',
    name: 'Welcome SMS',
    template: 'Dear {name}, Welcome to Dream60! Your registration is successful. You can now join auctions and win exciting gadgets. - Finpages Tech ',
    variables: ['name'],
    templateId: '1207176923373608591'
  },
  WINNER_PAYMENT: {
    id: 'winner_payment',
    name: 'Winner Payment',
    template: 'Congratulations {name} ,You have won in Dream60. To claim your prize, kindly complete the required payment of ₹ {amount}/- at your earliest convenience. - Finpages Tech ',
    variables: ['name', 'amount'],
    templateId: '1207176916032535720'
  },
  REFUND_NOTIFICATION: {
    id: 'refund_notification',
    name: 'Refund Notification',
    template: 'Dear {name}, Your {timeSlot} time slot bid has been cancelled, and the refund process has been initiated. The amount will be credited soon to the original payment source. Thank you for your patience. - Finpages Tech ',
    variables: ['name', 'timeSlot'],
    templateId: '1207176916920661369'
  },
  MOBILE_UPDATE: {
    id: 'mobile_update',
    name: 'Mobile Update',
    template: ' Dear {name}, Your mobile number has been updated successfully. If this wasn\'t done by you, please reach out to our support team right away. - Finpages Tech \n',
    variables: ['name'],
    templateId: '1207176916974016632'
  },
  RANK_ACHIEVEMENT: {
    id: 'rank_achievement',
    name: 'Rank Achievement',
    template: ' Congratulations {name} You have achieved Rank {rank}. Please wait for your turn to claim the prize. - Finpages Tech \n',
    variables: ['name', 'rank'],
    templateId: '1207176923013569344'
  },
  PASSWORD_RESET: {
    id: 'password_reset',
    name: 'Password Reset',
    template: ' Dear {name}, Your password reset verification code for Dream60 account is {otp}. This code will expire in 10 minutes. - Finpages Tech \n',
    variables: ['name', 'otp'],
    templateId: '1207176908078229051'
  },
  MOBILE_CHANGE_OTP: {
    id: 'mobile_change_otp',
    name: 'Mobile Change OTP',
    template: ' Dear {name}, Use this OTP {otp} to change your registered mobile number. Valid only for 10 Minutes. Do not share with anyone. – Finpages Tech ',
    variables: ['name', 'otp'],
    templateId: '1207176952069976461'
  },
  REFERRAL_INVITATION: {
    id: 'referral_invitation',
    name: 'Referral Invitation',
    template: 'I\'m inviting you on Nifty10 to play fantasy stock prediction and win real cash prizes. Just enter my referral code {code} while sign up, you will get a bonus cash of ₹{bonus} . Install on{link} - finpages',
    variables: ['code', 'bonus', 'link'],
    templateId: '1207174296988263792'
  },
  OTP_LOGIN_NIFTY10: {
    id: 'otp_login_nifty10',
    name: 'OTP Login Nifty10',
    template: 'Dear {name}, use this One Time Password(OTP) {otp} to login to your Nifty10 App. Its only valid for 10 minutes - Finpages',
    variables: ['name', 'otp'],
    templateId: '1207172612396743269'
  },
  REFUND_SUCCESS_NIFTY10: {
    id: 'refund_success_nifty10',
    name: 'Refund Success Nifty10',
    template: 'Dear User, Bids refund has been credited to your Nifty10 wallet - FINPAGES',
    variables: [],
    templateId: '1207174659231618433'
  },
  REFUND_DETAILED_NIFTY10: {
    id: 'refund_detailed_nifty10',
    name: 'Refund Detailed Nifty10',
    template: 'Dear {name}, We would like to inform you that the bid amount Rs. {amount} has been successfully refunded to your Nifty10 wallet. Thank you for choosing Nifty10. - Finpages',
    variables: ['name', 'amount'],
    templateId: '1207174662585501182'
  },
};

const formatTemplate = (templateId, variables = {}) => {
  const template = SMS_TEMPLATES[templateId];
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  let message = template.template;
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  
  return { success: true, message, template };
};

module.exports = {
  sendSms,
  sendBulkSms,
  getBalance,
  getDeliveryReports,
  SMS_TEMPLATES,
  formatTemplate,
};
