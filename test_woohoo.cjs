
const axios = require('axios');
require('dotenv').config({ path: './src/backend/.env' });

async function testAuth() {
    const verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL || 'https://sandbox.woohoo.in/oauth2/verify';
    const credentials = {
        clientId: process.env.WOOHOO_CLIENT_ID,
        username: process.env.WOOHOO_USERNAME,
        password: process.env.WOOHOO_PASSWORD
    };

    console.log('Testing with credentials:', { ...credentials, password: '***' });
    
    try {
        const response = await axios.post(verifyUrl, credentials);
        console.log('Success:', response.data);
    } catch (error) {
        console.log('Error Code:', error.response?.data?.code);
        console.log('Error Message:', error.response?.data?.message);
        
        console.log('Trying with client_id (snake_case)...');
        try {
            const response = await axios.post(verifyUrl, {
                client_id: credentials.clientId,
                username: credentials.username,
                password: credentials.password
            });
            console.log('Success with client_id:', response.data);
        } catch (error2) {
            console.log('Error with client_id:', error2.response?.data?.message || error2.message);
        }
    }
}

testAuth();
