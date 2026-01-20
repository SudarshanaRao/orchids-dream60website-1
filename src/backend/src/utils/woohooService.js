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
     */
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            // Step 1: Get Authorization Code
            const authResponse = await axios.post(this.verifyUrl, {
                clientId: this.clientId,
                username: this.username,
                password: this.password
            });

            if (!authResponse.data || !authResponse.data.authorizationCode) {
                throw new Error('Failed to get authorization code from Woohoo');
            }

            const authCode = authResponse.data.authorizationCode;

            // Step 2: Get Bearer Token
            const tokenResponse = await axios.post(this.tokenUrl, {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                authorizationCode: authCode
            });

            // V3 uses 'token' instead of 'accessToken'
            if (!tokenResponse.data || !tokenResponse.data.token) {
                throw new Error('Failed to get bearer token from Woohoo');
            }

            this.accessToken = tokenResponse.data.token;
            // Token usually valid for 1 week based on docs, but we use a safe expiry
            this.tokenExpiry = Date.now() + (7 * 24 * 3600 * 1000) - (60 * 60 * 1000); 
            
            return this.accessToken;
        } catch (error) {
            console.error('Woohoo Auth Error:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Sort object keys recursively for signature
     */
    _sortObject(object) {
        if (typeof object !== 'object' || object === null) {
            return object;
        }

        if (Array.isArray(object)) {
            return object.map(item => this._sortObject(item));
        }

        const sortedObj = {};
        const keys = Object.keys(object).sort();

        for (const key of keys) {
            sortedObj[key] = this._sortObject(object[key]);
        }
        return sortedObj;
    }

    /**
     * Normalize and encode URL for signature
     */
    _normalizeUrl(urlWithParams) {
        const url = new URL(urlWithParams);
        const scheme = url.protocol.toLowerCase();
        const host = url.hostname.toLowerCase();
        let port = url.port;

        // Remove default ports
        if ((scheme === 'http:' && port === '80') || (scheme === 'https:' && port === '443')) {
            port = '';
        }

        let normalizedPath = `${scheme}//${host}${port ? ':' + port : ''}${url.pathname}`;
        
        // Remove trailing slash from path if it exists
        if (normalizedPath.endsWith('/') && url.pathname !== '/') {
            normalizedPath = normalizedPath.slice(0, -1);
        }

        // Handle query params
        const params = [];
        url.searchParams.forEach((value, key) => {
            params.push({ key, value });
        });

        if (params.length > 0) {
            // Sort params by key
            params.sort((a, b) => a.key.localeCompare(b.key));
            const queryString = params.map(p => `${p.key}=${p.value}`).join('&');
            normalizedPath += `?${queryString}`;
        }

        return encodeURIComponent(normalizedPath);
    }

    /**
     * Generate HMAC SHA-512 Signature
     */
    _generateSignature(method, url, body) {
        const encodedUrl = this._normalizeUrl(url);
        let baseString = `${method.toUpperCase()}&${encodedUrl}`;
        
        if (body && Object.keys(body).length > 0) {
            const sortedBody = this._sortObject(body);
            const requestData = encodeURIComponent(JSON.stringify(sortedBody));
            baseString += `&${requestData}`;
        }

        return crypto.createHmac('sha512', this.clientSecret)
            .update(baseString)
            .digest('hex');
    }

    /**
     * Generic API Request with Auto-Token Refresh, Signature and Date headers
     */
    async request(method, endpoint, data = null, params = {}) {
        let token = await this.getAccessToken();

        try {
            // Build full URL with query params for signature calculation
            const urlObj = new URL(`${this.baseUrl}${endpoint}`);
            Object.entries(params).forEach(([key, value]) => {
                urlObj.searchParams.append(key, value);
            });
            
            // Add clientId to params for GET if not present
            if (method === 'GET' && !urlObj.searchParams.has('clientId')) {
                urlObj.searchParams.append('clientId', this.clientId?.trim());
            }

            const fullUrl = urlObj.toString();
            const dateAtClient = new Date().toISOString();
            
            // Add clientId to data for POST/PUT if not present
            let requestData = data;
            if (data && typeof data === 'object' && !Array.isArray(data) && (method === 'POST' || method === 'PUT')) {
                if (!requestData.clientId) {
                    requestData = {
                        ...data,
                        clientId: this.clientId?.trim()
                    };
                }
            }

            const signature = this._generateSignature(method, fullUrl, requestData);

            const response = await axios({
                method,
                url: fullUrl,
                data: requestData,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'dateAtClient': dateAtClient,
                    'signature': signature
                }
            });

            return response.data;
        } catch (error) {
            console.error(`Woohoo API Error (${endpoint}):`, error.response?.data || error.message);
            // Handle token rejection
            if (error.response?.status === 401) {
                this.accessToken = null; // Force refresh next time
            }
            throw error;
        }
    }

    /**
     * Get Categories
     */
    async getCategories() {
        return this.request('GET', '/rest/v3/catalog/categories');
    }

    /**
     * Get Products by Category
     */
    async getProducts(categoryId) {
        return this.request('GET', `/rest/v3/catalog/categories/${categoryId}/products`);
    }

    /**
     * Get Product Details
     */
    async getProductDetails(sku) {
        return this.request('GET', `/rest/v3/catalog/products/${sku}`);
    }

    /**
     * Create Order
     */
    async createOrder(orderDetails) {
        // refno must be unique and up to 25 chars
        const referenceNumber = orderDetails.refno || `D60${Date.now()}`.substring(0, 25);
        
        const payload = {
            address: {
                firstname: orderDetails.firstname || 'User',
                lastname: orderDetails.lastname || 'D60',
                email: orderDetails.email,
                telephone: orderDetails.telephone || orderDetails.phone,
                line1: orderDetails.addressLine1 || 'Online',
                line2: orderDetails.addressLine2 || '',
                city: orderDetails.city || 'Digital',
                region: orderDetails.region || 'Online',
                country: 'IN',
                postcode: orderDetails.postcode || '000000',
                billToThis: true
            },
            products: [
                {
                    sku: orderDetails.sku,
                    price: orderDetails.amount,
                    qty: orderDetails.qty || 1,
                    currency: 356 // INR
                }
            ],
            payments: [
                {
                    code: 'svc', // Fixed as svc per doc
                    amount: orderDetails.amount * (orderDetails.qty || 1)
                }
            ],
            refno: referenceNumber,
            syncOnly: orderDetails.syncOnly !== undefined ? orderDetails.syncOnly : false,
            deliveryMode: 'API'
        };

        return this.request('POST', '/rest/v3/orders', payload);
    }

    /**
     * Check Order Status
     */
    async getOrderStatus(orderId) {
        return this.request('GET', `/rest/v3/order/${orderId}/status`);
    }

    /**
     * Get Order Details
     */
    async getOrderDetails(orderId) {
        return this.request('GET', `/rest/v3/orders/${orderId}`);
    }

    /**
     * Get Card Balance
     */
    async getCardBalance(cardNumber) {
        return this.request('POST', '/rest/v3/balance', { cardNumber });
    }

    /**
     * Get Activated Cards
     */
    async getActivatedCards(orderId, offset = 0, limit = 0) {
        return this.request('GET', `/rest/v3/order/${orderId}/cards/`, null, { offset, limit });
    }

    /**
     * Resend Order Email/Voucher
     */
    async resendVoucher(orderId, cards) {
        return this.request('POST', `/rest/v3/orders/${orderId}/resend`, { cards });
    }

    /**
     * Get Account Balance (Partner Wallet)
     */
    async getAccountBalance() {
        return this.request('GET', '/rest/v3/accounts');
    }

    /**
     * Get Transaction History
     */
    async getTransactionHistory() {
        return this.request('GET', '/rest/v3/orders');
    }
}

module.exports = new WoohooService();
