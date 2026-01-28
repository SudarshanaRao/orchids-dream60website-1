const crypto = require('crypto');

const AIRPAY_USERNAME = "4VrPQMpk6a";
const AIRPAY_PASSWORD = "7p2rkB4A";
const AIRPAY_SECRET = "E78rbh2Ht5BbQWcn";

// The payload provided by the user
const responseData = "1284262c8ba80e4d+HPqPqfqmlm0DHrYJa9hc4kPwqS0EXIcRRCOeUpCfU2uUDf+Ez4Tmy9WOtL3aEQwVlCMi3y0IOMTCrqn/2aJ84KFEFZRp9wiecFgN9EmXKaE8T2L9gRVbD4X3/2GymgRGRSX5eKdm2Kbas3ZFn1Avmig+S39fn2qMz3fWGoUzOW49r05whz1IoiAAI5pjraJ4PPpsegTanoK7Ro7SnWzWeUszrKk15rLKsGvUCRa3N8EzIvZZqMHkOEByq8+RC9ATEWn2uH7W4ecgRt9e8sjtqfCdZf4crdH598fX8XjckkufM+IF7fD5/1FQArIfog4r9UXo/+vaGUeJQdVCItlGbjoRZE5Z+pQruGw8MQ1pYHZri+MZmuGgP6MSHU+mjHb3p1LuYkVy2mPMd0aMObsS1Vn76LmDoRAux4NDKMy6i9qn9SgfI5gUBHwOzVGcA/rIFE9GsgFHH6bFhpXyk9j2CNueYcOlmWSA3tvqRFW/8u0CHH4b0fVfmGJVS1jCqQuH8sOumVAsI5c1QTtVGJEI5hdWXTsRKzUiDzLlodbw+eEDx39bkYO7XzZgbvytJ7LKUaVoQvFgA0lUmAyrO21yFMVDZh6dgupiG06ttstlvmwbDON/yvZXui0FqILBEd6rQI35CfWfmffBE4gBiuSqQM1YP4TUQdNYAODN7josq2eXDNB77W5+oLCb1AsT2464G96gm0x5ug3AMBidYTTa+s/S9g5aRYIuRvbJaDTbCPzU/2Dugv9r+OPJos2Bnkit2Hy4+/oRnF1dN9jqtHpTVg8Gi1CU4AGQfIIpHyjJHPwzn3LQX7qE/Z5Gotvb/+x";

// Strategy 1: MD5 key as in airpayController.js
const keyMD5 = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');

// Strategy 2: SHA256 key as in some kits
const keySHA256 = crypto.createHash('sha256').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest();

function decrypt(data, secretKey, ivSource) {
    try {
        let iv;
        let encryptedData;
        
        if (ivSource === 'extracted') {
            iv = data.slice(0, 16);
            encryptedData = Buffer.from(data.slice(16), 'base64');
        } else if (ivSource === 'hashed') {
            const hash = crypto.createHash('sha256').update(data).digest();
            iv = hash.slice(0, 16);
            encryptedData = Buffer.from(data.slice(16), 'base64');
        }

        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf-8'), Buffer.from(iv, 'utf-8'));
        let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
        decrypted += decipher.final();
        return decrypted;
    } catch (error) {
        return 'Error (' + ivSource + '): ' + error.message;
    }
}

console.log('--- Decryption Test ---');
console.log('Key MD5:', keyMD5);
console.log('Result (MD5, extracted IV):', decrypt(responseData, keyMD5, 'extracted'));
console.log('Result (MD5, hashed IV):', decrypt(responseData, keyMD5, 'hashed'));
console.log('---');
console.log('Result (SHA256, extracted IV):', decrypt(responseData, keySHA256, 'extracted'));
console.log('Result (SHA256, hashed IV):', decrypt(responseData, keySHA256, 'hashed'));
