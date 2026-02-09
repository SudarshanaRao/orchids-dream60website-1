const fs = require('fs'); 
const path = 'src/backend/src/controllers/adminController.js'; 
let content = fs.readFileSync(path, 'utf8'); 
if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1); 
if (!content.startsWith('const User')) content = \"const User = require^('../models/user'^);\n\" + content; 
content = content.replace(/\\d\{4,6\}/g, '\\d{4}'); 
content = content.replace(/4-6 digits/g, 'exactly 4 digits'); 
fs.writeFileSync(path, content, 'utf8'); 
console.log('Done');
