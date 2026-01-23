// src/backend/src/utils/woohooService.js
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Try to load .env from multiple locations
const envPaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', '..', '.env'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
        console.log(`✅ Loaded environment variables from: ${envPath}`);
        envLoaded = true;
        break;
    }
}

if (!envLoaded) {
    console.warn('⚠️ WARNING: .env file not found in common locations. Using existing process.env.');
}

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
            console.log('=== Woohoo OAuth2.0 Step 1: Get Authorization Code ===');
            console.log('Verify URL:', this.verifyUrl);
            
            // Check if credentials are present
            if (!this.clientId || !this.username || !this.password) {
                console.error('❌ CRITICAL: Missing Woohoo credentials in process.env');
                console.log('Available keys:', Object.keys(process.env).filter(k => k.startsWith('WOOHOO_')));
                throw new Error('Missing WOOHOO_CLIENT_ID, WOOHOO_USERNAME, or WOOHOO_PASSWORD');
            }

            console.log('Client ID:', this.clientId.substring(0, 5) + '...');
            console.log('Username:', this.username);
            
            let authResponse;
            const requestData = {
                clientId: this.clientId,
                username: this.username,
                password: this.password
            };

            try {
                authResponse = await axios.post(this.verifyUrl, requestData, {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                console.error('Verify Step 1 failed:', err.response?.data || err.message);
                
                // If 8308 or 400 with "mandatory" fields error, try fallback variations
                const errorData = err.response?.data;
                const messages = errorData?.messages || [];
                const isMandatoryError = messages.some(m => m.includes('mandatory'));

                if (errorData?.code === 8308 || isMandatoryError) {
                    console.log('Attempting fallback with different field names...');
                    try {
                        // Try snake_case and email field
                        authResponse = await axios.post(this.verifyUrl, {
                            client_id: this.clientId,
                            email: this.username,
                            password: this.password
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (err2) {
                        console.error('Verify Step 2 fallback failed:', err2.response?.data || err2.message);
                        
                        // Try clientId and email field
                        console.log('Attempting second fallback...');
                        authResponse = await axios.post(this.verifyUrl, {
                            clientId: this.clientId,
                            email: this.username,
                            password: this.password
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    }
                } else {
                    throw err;
                }
            }

            console.log('Auth Response Code:', authResponse.status);

            if (!authResponse.data || !authResponse.data.authorizationCode) {
                throw new Error('Failed to get authorization code from Woohoo');
            }

            const authCode = authResponse.data.authorizationCode;
            console.log('=== Woohoo OAuth2.0 Step 2: Get Bearer Token ===');
            
            const tokenResponse = await axios.post(this.tokenUrl, {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                authorizationCode: authCode
            });

            if (!tokenResponse.data || !tokenResponse.data.token) {
                throw new Error('Failed to get bearer token from Woohoo: ' + JSON.stringify(tokenResponse.data));
            }

            this.accessToken = tokenResponse.data.token;
            this.tokenExpiry = Date.now() + (6 * 24 * 3600 * 1000);
            
            console.log('=== Woohoo OAuth2.0 Authentication Successful ===');
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
            
            // For Woohoo V3, clientId is often mandatory in the request body for POST/PUT 
            // even if it's in the headers. Adding it to data if it's an object.
            let requestData = data;
            if (data && typeof data === 'object' && !Array.isArray(data) && (method === 'POST' || method === 'PUT')) {
                requestData = {
                    ...data,
                    clientId: this.clientId?.trim()
                };
            }

            const response = await axios({
                method,
                url,
                data: requestData,
                params,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'dateAtClient': dateAtClient,
                    'signature': signature
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

    async getProductsList(params = {}) {
        return this.request('GET', '/rest/v3/catalog/products', null, params);
    }

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
            address: {
                firstname: orderDetails.firstname,
                lastname: orderDetails.lastname,
                email: orderDetails.email,
                mobile: orderDetails.phone,
                billing: orderDetails.billingAddress,
                shipping: orderDetails.shippingAddress
            },
            products: [
                {
                    sku: orderDetails.sku,
                    price: orderDetails.amount,
                    quantity: 1
                }
            ],
            payments: [
                {
                    code: this.svc,
                    amount: orderDetails.amount
                }
            ],
            refno: referenceNumber,
            sync_only: true, // For quantity 1
            deliveryMode: 'API'
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
     * Get Transaction History for a card
     * documentation: baseurl/rest/v3/transaction/history
     * Method: POST
     */
    async getTransactionHistory(options = {}) {
        const {
            startDate,
            endDate,
            limit = 10,
            offset = 0,
            cards = []
        } = options;

        const payload = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            cards: cards
        };

        if (startDate) payload.startDate = startDate;
        if (endDate) payload.endDate = endDate;

        // If no cards provided, default to SVC card if available
        if (payload.cards.length === 0 && this.svc) {
            payload.cards.push({
                cardNumber: this.svc
            });
        }

        if (payload.cards.length === 0) {
            throw new Error('At least one card is required for transaction history');
        }

        return this.request('POST', '/rest/v3/transaction/history', payload);
    }

    /**
     * Get Activated Cards (For sync_only=false or after order completion)
     */
    async getActivatedCards(orderId) {
        return this.request('GET', `/v3/orders/${orderId}/cards`);
    }
}

module.exports = new WoohooService();
