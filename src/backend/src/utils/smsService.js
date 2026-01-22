const axios = require('axios');

const SMS_API_URL = 'https://api.smscountry.com/SMSCwebservice_bulk.aspx';
const SMS_BALANCE_URL = 'https://api.smscountry.com/SMSCwebservice_User_GetBal.asp';
const SMS_REPORTS_URL = 'https://api.smscountry.com/smscwebservices_bulk_reports.aspx';

const client = axios.create({
  timeout: 15000,
});

const getSmsConfig = () => ({
  user: process.env.SMSCOUNTRY_USER,
  passwd: process.env.SMSCOUNTRY_PASSWORD,
  sid: process.env.SMSCOUNTRY_SENDER_ID || 'DREAM60',
});

const sendSms = async (mobileNumbers, message, options = {}) => {
  try {
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
    
    const balance = parseFloat(response.data?.trim()) || 0;
    return { success: true, balance };
  } catch (error) {
    console.error('Get SMS Balance Error:', error.message);
    return { success: false, error: error.message };
  }
};

const getDeliveryReports = async (fromDate, toDate) => {
  try {
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
      template: 'Dear User, use this One Time Password(OTP) {otp} to login to your Nifty10 App. Its only valid for 10 minutes - Finpages',
      variables: ['otp'],
      templateId: '1207172612396743269'
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
