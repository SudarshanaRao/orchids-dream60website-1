const crypto = require('crypto');

const AIRPAY_USERNAME = "4VrPQMpk6a";
const AIRPAY_PASSWORD = "7p2rkB4A";
const responseData = "8f16b44731634factzk7qSPvWmRtWKHBjG+R0/xoB/TCjhqs2uwBSYO2Ci1O29VwKGAAMgHewovX237Sx9Ws+c4UrwWc1s8twfO76RE7v6ftqGE99F+1qxKOmGuJzz/WgFKqSPDFIlZIYtvRmvhIT5pnCwgAvjMIjq2wng==";

// Trying md5 hex as key
const key = crypto.createHash('md5').update(AIRPAY_USERNAME + "~:~" + AIRPAY_PASSWORD).digest('hex');

function decrypt(data, secretKey) {
  try {
    const iv = data.slice(0, 16);
    const encryptedData = Buffer.from(data.slice(16), 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey, 'utf8'), Buffer.from(iv, 'utf-8'));
    let decrypted = decipher.update(encryptedData, 'binary', 'utf8');
    decrypted += decipher.final();
    return decrypted;
  } catch (error) {
    return 'Error: ' + error.message;
  }
}

console.log('Decrypted with MD5 Hex:', decrypt(responseData, key));
