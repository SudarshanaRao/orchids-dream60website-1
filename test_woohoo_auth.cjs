const axios = require('axios');
require('dotenv').config();

async function test() {
    const clientId = process.env.WOOHOO_CLIENT_ID;
    const username = process.env.WOOHOO_USERNAME;
    const password = process.env.WOOHOO_PASSWORD;
    const verifyUrl = process.env.WOOHOO_AUTH_VERIFY_URL;
    
    console.log('Testing with:');
    console.log('URL:', verifyUrl);
    console.log('ClientID:', clientId);
    console.log('Username:', username);
    console.log('Password:', password);
    
    try {
        const res = await axios.post(verifyUrl, {
            clientId,
            username,
            password
        }, {
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.log('Error:', e.response?.data || e.message);
    }
}
test();
