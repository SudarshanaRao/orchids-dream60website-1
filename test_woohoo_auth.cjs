const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

const clientId = process.env.WOOHOO_CLIENT_ID;
const clientSecret = process.env.WOOHOO_CLIENT_SECRET;
const username = process.env.WOOHOO_USERNAME;
const password = process.env.WOOHOO_PASSWORD;
const verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL || 'https://sandbox.woohoo.in/oauth2/verify';
const tokenUrl = process.env.WOOHOO_TOKEN_URL || 'https://sandbox.woohoo.in/oauth2/token';
const baseUrl = 'https://sandbox.woohoo.in';

console.log('=== Woohoo OAuth2.0 Test ===');
console.log('Client ID:', clientId);
console.log('Username:', username);
console.log('Verify URL:', verifyUrl);
console.log('Token URL:', tokenUrl);
console.log();

function sortObjectKeys(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sortObjectKeys(item));
    }
    const sortedObj = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
        sortedObj[key] = sortObjectKeys(obj[key]);
    }
    return sortedObj;
}

function encodeRFC3986(str) {
    return encodeURIComponent(str)
        .replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}

function generateSignature(method, fullUrl, body = null) {
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
    
    const encodedUrl = encodeRFC3986(normalizedUrl);
    
    let baseString = `${method.toUpperCase()}&${encodedUrl}`;
    
    if (body && typeof body === 'object' && Object.keys(body).length > 0) {
        const sortedBody = sortObjectKeys(body);
        const bodyString = JSON.stringify(sortedBody);
        const encodedBody = encodeRFC3986(bodyString);
        baseString += `&${encodedBody}`;
    }

    console.log('Base String (first 200 chars):', baseString.substring(0, 200));
    
    return crypto.createHmac('sha512', clientSecret)
        .update(baseString)
        .digest('hex');
}

async function testAuth() {
    try {
        console.log('=== Step 1: Get Authorization Code ===');
        console.log('POST', verifyUrl);
        console.log('Body:', JSON.stringify({ clientId, username, password }, null, 2));
        
        const authResponse = await axios.post(verifyUrl, {
            clientId,
            username,
            password
        }, {
            headers: { 
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('Auth Response Status:', authResponse.status);
        console.log('Auth Response Data:', JSON.stringify(authResponse.data, null, 2));

        if (!authResponse.data.authorizationCode) {
            console.error('No authorization code received!');
            return;
        }

        const authCode = authResponse.data.authorizationCode;
        
        console.log('\n=== Step 2: Get Bearer Token ===');
        console.log('POST', tokenUrl);
        console.log('Body:', JSON.stringify({ clientId, clientSecret: '***', authorizationCode: authCode }, null, 2));
        
        const tokenResponse = await axios.post(tokenUrl, {
            clientId,
            clientSecret,
            authorizationCode: authCode
        }, {
            headers: { 
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        console.log('Token Response Status:', tokenResponse.status);
        console.log('Token Response Data:', JSON.stringify(tokenResponse.data, null, 2));

        if (!tokenResponse.data.token) {
            console.error('No token received!');
            return;
        }

        const token = tokenResponse.data.token;
        console.log('\n=== Step 3: Test API Call - Get Categories ===');
        
        const apiUrl = `${baseUrl}/rest/v3/catalog/categories`;
        const dateAtClient = new Date().toISOString();
        const signature = generateSignature('GET', apiUrl, null);
        
        console.log('GET', apiUrl);
        console.log('Headers: Authorization: Bearer ***');
        console.log('Headers: dateAtClient:', dateAtClient);
        console.log('Headers: signature:', signature.substring(0, 50) + '...');
        
        const apiResponse = await axios.get(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'dateAtClient': dateAtClient,
                'signature': signature
            },
            timeout: 30000
        });

        console.log('API Response Status:', apiResponse.status);
        console.log('API Response Data:', JSON.stringify(apiResponse.data, null, 2).substring(0, 1000));
        
        console.log('\n=== SUCCESS: Woohoo OAuth2.0 Authentication Working! ===');

    } catch (error) {
        console.error('\n=== ERROR ===');
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));
        console.error('Message:', error.message);
        
        if (error.response?.status === 403) {
            console.error('\n*** IP NOT WHITELISTED ***');
            console.error('The Woohoo sandbox is blocking requests from this IP address.');
            console.error('You need to run this test from your whitelisted server (dev-api.dream60.com).');
        }
    }
}

testAuth();
