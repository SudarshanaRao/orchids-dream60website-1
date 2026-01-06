// src/backend/src/utils/woohooService.js
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class WoohooService {
    constructor() {
        this.clientId = process.env.WOOHOO_CLIENT_ID;
        this.clientSecret = process.env.WOOHOO_CLIENT_SECRET;
        this.username = process.env.WOOHOO_USERNAME;
        this.password = process.env.WOOHOO_PASSWORD;
        this.baseUrl = process.env.WOOHOO_BASE_URL;
        this.tokenUrl = process.env.WOOHOO_TOKEN_URL;
        this.verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL;
        this.svc = process.env.WOOHOO_SVC;
        
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get OAuth 2.0 Token
     * Note: In production, this should be stored in DB.
     */
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Step 1: Get Authorization Code
            // Using both camelCase and snake_case for maximum compatibility
            // Trimming values to avoid hidden space issues
            const authResponse = await axios.post(this.verifyUrl, {
                client_id: this.clientId?.trim(),
                username: this.username?.trim(),
                password: this.password?.trim()
            });

            if (!authResponse.data || !authResponse.data.authorizationCode) {
                throw new Error('Failed to get authorization code from Woohoo');
            }

            const authCode = authResponse.data.authorizationCode;

            // Step 2: Get Access Token
            const tokenResponse = await axios.post(this.tokenUrl, {
                clientId: this.clientId?.trim(),
                client_id: this.clientId?.trim(),
                clientSecret: this.clientSecret?.trim(),
                client_secret: this.clientSecret?.trim(),
                authorizationCode: authCode
            });

            if (!tokenResponse.data || !tokenResponse.data.accessToken) {
                throw new Error('Failed to get access token from Woohoo');
            }

            this.accessToken = tokenResponse.data.accessToken;
            // Token usually valid for 1 hour, setting safety margin
            this.tokenExpiry = Date.now() + (3600 * 1000) - (5 * 60 * 1000); 
            
            return this.accessToken;
        } catch (error) {
            console.error('Woohoo Auth Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Generic API Request with Auto-Token Refresh
     */
    async request(method, endpoint, data = null, params = {}) {
        let token = await this.getAccessToken();

        try {
            const url = `${this.baseUrl}${endpoint}`;
            const date = new Date().toISOString();
            
            // For Woohoo V3, clientId and client_id are often mandatory in the request body for POST/PUT 
            // especially for the Order API. Adding both for maximum compatibility.
            let requestData = data;
            if (data && typeof data === 'object' && !Array.isArray(data) && (method === 'POST' || method === 'PUT')) {
                requestData = {
                    ...data,
                    clientId: this.clientId?.trim(),
                    client_id: this.clientId?.trim()
                };
            }

            // Calculate signature for V3 Revamp
            // Pattern: clientId + date + requestBody (if exists)
            let signature = '';
            if (this.clientSecret) {
                const bodyStr = requestData ? JSON.stringify(requestData) : '';
                const signStr = (this.clientId?.trim() || '') + date + bodyStr;
                signature = crypto
                    .createHmac('sha256', this.clientSecret.trim())
                    .update(signStr)
                    .digest('hex');
            }

            const response = await axios({
                method,
                url,
                data: requestData,
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'clientId': this.clientId?.trim(),
                    'client_id': this.clientId?.trim(),
                    'date': date,
                    'signature': signature,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            return response.data;
        } catch (error) {
            // Handle token rejection
            if (error.response?.status === 401 && error.response?.data?.message?.includes('token_rejected')) {
                this.accessToken = null; // Force refresh
                return this.request(method, endpoint, data, params);
            }
            throw error;
        }
    }

    /**
     * Get Categories
     */
    async getCategories() {
        return this.request('GET', '/v3/categories');
    }

    /**
     * Get Products by Category
     */
    async getProducts(categoryId) {
        return this.request('GET', `/v3/categories/${categoryId}/products`);
    }

    /**
     * Get Product Details
     */
    async getProductDetails(sku) {
        return this.request('GET', `/v3/products/${sku}`);
    }

    /**
     * Create Order (Spend API)
     */
    async createOrder(orderDetails) {
        const referenceNumber = `D60_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`.substring(0, 25);
        
        const payload = {
            clientId: this.clientId?.trim(),
            client_id: this.clientId?.trim(),
            address: {
                firstname: orderDetails.firstname || 'Customer',
                lastname: orderDetails.lastname || 'Dream60',
                email: orderDetails.email || 'support@dream60.com',
                mobile: orderDetails.phone || '0000000000',
                billing: {
                    firstname: orderDetails.billingAddress?.firstname || orderDetails.firstname || 'Customer',
                    lastname: orderDetails.billingAddress?.lastname || orderDetails.lastname || 'Dream60',
                    email: orderDetails.billingAddress?.email || orderDetails.email || 'support@dream60.com',
                    mobile: orderDetails.billingAddress?.mobile || orderDetails.phone || '0000000000',
                    line1: orderDetails.billingAddress?.line1 || 'Dream60 Office',
                    city: orderDetails.billingAddress?.city || 'Bangalore',
                    region: orderDetails.billingAddress?.region || 'Karnataka',
                    country: orderDetails.billingAddress?.country || 'IN',
                    postcode: orderDetails.billingAddress?.postcode || '560001'
                },
                shipping: {
                    firstname: orderDetails.shippingAddress?.firstname || orderDetails.firstname || 'Customer',
                    lastname: orderDetails.shippingAddress?.lastname || orderDetails.lastname || 'Dream60',
                    email: orderDetails.shippingAddress?.email || orderDetails.email || 'support@dream60.com',
                    mobile: orderDetails.shippingAddress?.mobile || orderDetails.phone || '0000000000',
                    line1: orderDetails.shippingAddress?.line1 || 'Dream60 Office',
                    city: orderDetails.shippingAddress?.city || 'Bangalore',
                    region: orderDetails.shippingAddress?.region || 'Karnataka',
                    country: orderDetails.shippingAddress?.country || 'IN',
                    postcode: orderDetails.shippingAddress?.postcode || '560001'
                }
            },
            products: [
                {
                    sku: orderDetails.sku,
                    price: orderDetails.amount,
                    quantity: 1,
                    currency: 'INR' // V3 Revamp often prefers string code
                }
            ],
            payments: [
                {
                    code: this.svc?.trim(),
                    amount: orderDetails.amount,
                    currency: 'INR'
                }
            ],
            refno: referenceNumber,
            sync_only: true,
            deliveryMode: 'API',
            fulfillmentMode: 'DIRECT'
        };

        return this.request('POST', '/v3/orders', payload);
    }

    /**
     * Check Order Status
     */
    async getOrderStatus(orderId) {
        return this.request('GET', `/v3/orders/${orderId}/status`);
    }

    /**
     * Get Account Balance (SVC Balance)
     */
    async getAccountBalance() {
        return this.request('GET', '/v3/accounts');
    }

    /**
     * Get Transaction History (Orders)
     */
    async getTransactionHistory() {
        return this.request('GET', '/v3/orders');
    }

    /**
     * Get Activated Cards (For sync_only=false or after order completion)
     */
    async getActivatedCards(orderId) {
        return this.request('GET', `/v3/orders/${orderId}/cards`);
    }
}

module.exports = new WoohooService();
