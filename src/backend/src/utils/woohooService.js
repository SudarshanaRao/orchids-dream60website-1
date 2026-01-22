const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class WoohooService {
    constructor() {
        this.clientId = process.env.WOOHOO_CLIENT_ID;
        this.clientSecret = process.env.WOOHOO_CLIENT_SECRET;
        this.username = process.env.WOOHOO_USERNAME;
        this.password = process.env.WOOHOO_PASSWORD;
        this.baseUrl = process.env.WOOHOO_BASE_URL || 'https://sandbox.woohoo.in';
        this.tokenUrl = process.env.WOOHOO_TOKEN_URL || 'https://sandbox.woohoo.in/oauth2/token';
        this.verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL || 'https://sandbox.woohoo.in/oauth2/verify';
        this.svc = process.env.WOOHOO_SVC;
        
        if (this.baseUrl.endsWith('/rest')) {
            this.baseUrl = this.baseUrl.replace(/\/rest$/, '');
        }
        
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }

        try {
            console.log('=== Woohoo OAuth2.0 Step 1: Get Authorization Code ===');
            console.log('Verify URL:', this.verifyUrl);
            console.log('Client ID:', this.clientId);
            console.log('Username:', this.username);
            
            let authResponse;
            try {
                authResponse = await axios.post(this.verifyUrl, {
                    clientId: this.clientId,
                    username: this.username,
                    password: this.password
                }, {
                    headers: { 'Content-Type': 'application/json' }
                });
            } catch (err) {
                // If 8308 error, try with client_id (snake_case) or email field
                if (err.response?.data?.code === 8308) {
                    console.log('Got 8308, trying fallback with client_id and email...');
                    try {
                        authResponse = await axios.post(this.verifyUrl, {
                            client_id: this.clientId,
                            email: this.username,
                            password: this.password
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    } catch (err2) {
                        // If still failing, try one more combination
                        if (err2.response?.data?.code === 8308) {
                            console.log('Still got 8308, trying with clientId and email...');
                            authResponse = await axios.post(this.verifyUrl, {
                                clientId: this.clientId,
                                email: this.username,
                                password: this.password
                            }, {
                                headers: { 'Content-Type': 'application/json' }
                            });
                        } else {
                            throw err2;
                        }
                    }
                } else {
                    throw err;
                }
            }

            console.log('Auth Response:', JSON.stringify(authResponse.data, null, 2));

            if (!authResponse.data || !authResponse.data.authorizationCode) {
                throw new Error('Failed to get authorization code from Woohoo: ' + JSON.stringify(authResponse.data));
            }

            const authCode = authResponse.data.authorizationCode;
            console.log('=== Woohoo OAuth2.0 Step 2: Get Bearer Token ===');
            console.log('Token URL:', this.tokenUrl);
            console.log('Authorization Code:', authCode);

            const tokenResponse = await axios.post(this.tokenUrl, {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                authorizationCode: authCode
            }, {
                headers: { 
                    'Content-Type': 'application/json'
                }
            });

            console.log('Token Response:', JSON.stringify(tokenResponse.data, null, 2));

            if (!tokenResponse.data || !tokenResponse.data.token) {
                throw new Error('Failed to get bearer token from Woohoo: ' + JSON.stringify(tokenResponse.data));
            }

            this.accessToken = tokenResponse.data.token;
            this.tokenExpiry = Date.now() + (6 * 24 * 3600 * 1000);
            
            console.log('=== Woohoo OAuth2.0 Authentication Successful ===');
            console.log('Token expires in 6 days');
            
            return this.accessToken;
        } catch (error) {
            console.error('=== Woohoo Auth Error ===');
            console.error('Status:', error.response?.status);
            console.error('Data:', JSON.stringify(error.response?.data, null, 2));
            console.error('Message:', error.message);
            throw error;
        }
    }

    _sortObjectKeys(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this._sortObjectKeys(item));
        }

        const sortedObj = {};
        const keys = Object.keys(obj).sort();

        for (const key of keys) {
            sortedObj[key] = this._sortObjectKeys(obj[key]);
        }
        return sortedObj;
    }

    _encodeRFC3986(str) {
        return encodeURIComponent(str)
            .replace(/!/g, '%21')
            .replace(/'/g, '%27')
            .replace(/\(/g, '%28')
            .replace(/\)/g, '%29')
            .replace(/\*/g, '%2A');
    }

    _generateSignature(method, fullUrl, body = null) {
        const urlObj = new URL(fullUrl);
        
        const params = [];
        urlObj.searchParams.forEach((value, key) => {
            params.push({ key, value });
        });
        
        let normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        
        if (params.length > 0) {
            params.sort((a, b) => a.key.localeCompare(b.key));
            const sortedQueryString = params.map(p => `${p.key}=${p.value}`).join('&');
            normalizedUrl += `?${sortedQueryString}`;
        }
        
        const encodedUrl = this._encodeRFC3986(normalizedUrl);
        
        let baseString = `${method.toUpperCase()}&${encodedUrl}`;
        
        if (body && typeof body === 'object' && Object.keys(body).length > 0) {
            const sortedBody = this._sortObjectKeys(body);
            const bodyString = JSON.stringify(sortedBody);
            const encodedBody = this._encodeRFC3986(bodyString);
            baseString += `&${encodedBody}`;
        }

        const signature = crypto.createHmac('sha512', this.clientSecret)
            .update(baseString)
            .digest('hex');
        
        console.log('=== Signature Generation ===');
        console.log('Method:', method.toUpperCase());
        console.log('URL:', normalizedUrl);
        console.log('Base String:', baseString.substring(0, 200) + '...');
        console.log('Signature:', signature.substring(0, 50) + '...');
        
        return signature;
    }

    async request(method, endpoint, data = null, queryParams = {}) {
        const token = await this.getAccessToken();

        try {
            const fullUrl = new URL(`${this.baseUrl}${endpoint}`);
            
            Object.entries(queryParams).forEach(([key, value]) => {
                fullUrl.searchParams.append(key, String(value));
            });

            const dateAtClient = new Date().toISOString();
            const signature = this._generateSignature(method, fullUrl.toString(), data);

            console.log('=== Woohoo API Request ===');
            console.log('Method:', method);
            console.log('URL:', fullUrl.toString());
            console.log('dateAtClient:', dateAtClient);
            
            const response = await axios({
                method,
                url: fullUrl.toString(),
                data: data,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'dateAtClient': dateAtClient,
                    'signature': signature
                }
            });

            console.log('=== Woohoo API Response ===');
            console.log('Status:', response.status);
            
            return response.data;
        } catch (error) {
            console.error('=== Woohoo API Error ===');
            console.error('Endpoint:', endpoint);
            console.error('Status:', error.response?.status);
            console.error('Data:', JSON.stringify(error.response?.data, null, 2));
            if (error.response?.status === 401) {
                this.accessToken = null;
            }
            throw error;
        }
    }

    async getCategories() {
        return this.request('GET', '/rest/v3/catalog/categories');
    }

    async getProductsList(params = {}) {
        return this.request('GET', '/rest/v3/catalog/products', null, params);
    }

    async getProducts(categoryId) {
        return this.request('GET', `/rest/v3/catalog/categories/${categoryId}/products`);
    }

    async getProductDetails(sku) {
        return this.request('GET', `/rest/v3/catalog/products/${sku}`);
    }

    async createOrder(orderDetails) {
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
                    currency: 356
                }
            ],
            payments: [
                {
                    code: 'svc',
                    amount: orderDetails.amount * (orderDetails.qty || 1)
                }
            ],
            refno: referenceNumber,
            syncOnly: orderDetails.syncOnly !== undefined ? orderDetails.syncOnly : false,
            deliveryMode: 'API'
        };

        return this.request('POST', '/rest/v3/orders', payload);
    }

    async getOrderStatus(orderId) {
        return this.request('GET', `/rest/v3/order/${orderId}/status`);
    }

    async getOrderDetails(orderId) {
        return this.request('GET', `/rest/v3/orders/${orderId}`);
    }

    /**
     * Check balance of a specific gift card
     * documentation: baseurl/rest/v3/balance
     * Method: POST
     * Success: 201 Created
     * Failure: 400 Bad Request (Business Failure)
     */
    async getCardBalance(cardNumber, pin = null, sku = null) {
        if (!cardNumber) {
            throw new Error('Card number is mandatory for balance check');
        }

        const payload = { cardNumber };
        
        // Optional parameters: only include if they are not blank/null
        if (pin && pin.trim() !== '') {
            payload.pin = pin;
        }
        
        if (sku && sku.trim() !== '') {
            payload.sku = sku;
        }

        try {
            return await this.request('POST', '/rest/v3/balance', payload);
        } catch (error) {
            // Special handling for Balance API failures (Status 400)
            if (error.response?.status === 400) {
                const errorData = error.response.data;
                console.error('Woohoo Balance API Business Failure:', errorData.message || 'Unknown error');
                // Re-throw with more context if available
                const customError = new Error(errorData.message || 'Balance Enquiry Failed');
                customError.code = errorData.code;
                customError.status = 400;
                customError.additionalTxnFields = errorData.additionalTxnFields;
                throw customError;
            }
            throw error;
        }
    }

    async getActivatedCards(orderId, offset = 0, limit = 100) {
        return this.request('GET', `/rest/v3/order/${orderId}/cards/`, null, { offset, limit });
    }

    async resendVoucher(orderId, cards) {
        return this.request('POST', `/rest/v3/orders/${orderId}/resend`, { cards });
    }

    async getAccountBalance() {
        return this.request('GET', '/rest/v3/accounts');
    }

    async getTransactionHistory() {
        return this.request('GET', '/rest/v3/orders');
    }

    async getSVCBalance() {
        const svcCardNumber = this.svc;
        if (!svcCardNumber) {
            throw new Error('WOOHOO_SVC environment variable not set');
        }
        return this.getCardBalance(svcCardNumber);
    }
}

module.exports = new WoohooService();
