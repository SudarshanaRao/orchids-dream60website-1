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
        this.tokenUrl = process.env.WOOHOO_TOKEN_URL;
        this.verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL;
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
            console.log('Woohoo Auth Attempt:', {
                verifyUrl: this.verifyUrl,
                clientId: this.clientId,
                username: this.username,
                password: this.password,
                passwordLength: this.password?.length
            });
            
            const authPayload = {
                clientId: this.clientId,
                username: this.username,
                password: this.password
            };
            
            console.log('Woohoo Auth Payload:', JSON.stringify(authPayload));
            
            const authResponse = await axios.post(this.verifyUrl, authPayload, {
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!authResponse.data || !authResponse.data.authorizationCode) {
                throw new Error('Failed to get authorization code from Woohoo');
            }

            const authCode = authResponse.data.authorizationCode;

            const tokenResponse = await axios.post(this.tokenUrl, {
                clientId: this.clientId,
                clientSecret: this.clientSecret,
                authorizationCode: authCode
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!tokenResponse.data || !tokenResponse.data.token) {
                throw new Error('Failed to get bearer token from Woohoo');
            }

            this.accessToken = tokenResponse.data.token;
            this.tokenExpiry = Date.now() + (6 * 24 * 3600 * 1000);
            
            return this.accessToken;
        } catch (error) {
            console.error('Woohoo Auth Error:', error.response?.data || error.message);
            throw error;
        }
    }

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
        
        let normalizedUrl = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
        
        const params = [];
        urlObj.searchParams.forEach((value, key) => {
            params.push({ key, value });
        });
        
        if (params.length > 0) {
            params.sort((a, b) => a.key.localeCompare(b.key));
            const queryString = params.map(p => `${p.key}=${p.value}`).join('&');
            normalizedUrl += `?${queryString}`;
        }
        
        const encodedUrl = this._encodeRFC3986(normalizedUrl);
        
        let baseString = `${method.toUpperCase()}&${encodedUrl}`;
        
        if (body && typeof body === 'object' && Object.keys(body).length > 0) {
            const sortedBody = this._sortObject(body);
            const bodyString = JSON.stringify(sortedBody);
            const encodedBody = this._encodeRFC3986(bodyString);
            baseString += `&${encodedBody}`;
        }

        return crypto.createHmac('sha512', this.clientSecret)
            .update(baseString)
            .digest('hex');
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

            return response.data;
        } catch (error) {
            console.error(`Woohoo API Error (${endpoint}):`, error.response?.data || error.message);
            if (error.response?.status === 401) {
                this.accessToken = null;
            }
            throw error;
        }
    }

    async getCategories() {
        return this.request('GET', '/rest/v3/catalog/categories');
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

    async getCardBalance(cardNumber, pin = null, sku = null) {
        const payload = { cardNumber };
        if (pin) payload.pin = pin;
        if (sku) payload.sku = sku;
        return this.request('POST', '/rest/v3/balance', payload);
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
        return this.request('POST', '/rest/v3/balance', { cardNumber: svcCardNumber });
    }
}

module.exports = new WoohooService();
