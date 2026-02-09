const fs = require('fs'); 
const p = 'src/backend/src/controllers/adminController.js'; 
let c = fs.readFileSync(p, 'utf8'); 
if (c.charCodeAt(0) === 0xFEFF) c = c.slice(1); 
if (!c.startsWith('const User')) c = \"const User = require('../models/user');\n\" + c; 
c = c.replace(/\\d\{4,6\}/g, '\\d{4}'); 
c = c.replace(/4-6 digits/g, 'exactly 4 digits'); 
fs.writeFileSync(p, c, 'utf8'); 
console.log('Done'); 
