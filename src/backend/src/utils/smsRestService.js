const axios = require('axios');

/**
 * SMSCountry REST API Service
 * Based on Communication API documentation
 */
class SmsRestService {
  constructor() {
    this.authKey = process.env.SMSCOUNTRY_AUTH_KEY;
    this.authToken = process.env.SMSCOUNTRY_AUTH_TOKEN;
    this.baseUrl = 'https://restapi.smscountry.com/v0.1/Accounts';
    
    if (this.authKey && this.authToken) {
      const auth = Buffer.from(`${this.authKey}:${this.authToken}`).toString('base64');
      this.client = axios.create({
        baseURL: `${this.baseUrl}/${this.authKey}`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      });
    }
  }

  isConfigured() {
    return !!(this.authKey && this.authToken);
  }

  /**
   * Send a single SMS
   */
  async sendSms(mobileNumber, message, senderId) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const payload = {
        Text: message,
        Number: this.formatNumber(mobileNumber),
        SenderId: senderId || process.env.SMSCOUNTRY_SENDER_ID || 'FINPGS',
        DRNotifyUrl: '',
        DRNotifyHttpMethod: 'POST',
        Tool: 'API'
      };

      const response = await this.client.post('/SMSes/', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Send Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Send bulk SMS
   */
  async sendBulkSms(numbers, message, senderId) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const payload = {
        Text: message,
        Numbers: numbers.map(n => this.formatNumber(n)),
        SenderId: senderId || process.env.SMSCOUNTRY_SENDER_ID || 'FINPGS',
        DRNotifyUrl: '',
        DRNotifyHttpMethod: 'POST',
        Tool: 'API'
      };

      const response = await this.client.post('/BulkSMSes/', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Bulk Send Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Get SMS delivery status
   */
  async getSmsReport(messageId) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const response = await this.client.get(`/SMSes/${messageId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Report Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Get detailed SMS reports with filters
   */
  async getDetailedReports(params = {}) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const response = await this.client.get('/SMSes/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Detailed Report Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Get account SenderIDs
   */
  async getSenderIds() {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const response = await this.client.get('/SenderIDs/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest SenderID Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Get SMS templates
   */
  async getTemplates() {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const response = await this.client.get('/Templates/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Get Templates Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Create a new SMS template
   */
  async createTemplate(templateName, message) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const payload = {
        Name: templateName,
        Template: message
      };
      const response = await this.client.post('/Templates/', payload);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Create Template Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  /**
   * Delete an SMS template
   */
  async deleteTemplate(templateId) {
    if (!this.isConfigured()) return { success: false, error: 'SMS service not configured' };

    try {
      const response = await this.client.delete(`/Templates/${templateId}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('SMS Rest Delete Template Error:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.Message || error.message };
    }
  }

  formatNumber(num) {
    let cleaned = num.toString().replace(/[\s\-\+]/g, '');
    if (!cleaned.startsWith('91') && cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    return cleaned;
  }
}

module.exports = new SmsRestService();
