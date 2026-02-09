const fs = require('fs');
const path = require('path');

const targetPath = process.argv[2];
if (!targetPath) {
  console.log('Usage: node _helper.js <path>');
  process.exit(1);
}

try {
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    console.log(fs.readdirSync(targetPath).join('\n'));
  } else {
    console.log(fs.readFileSync(targetPath, 'utf8'));
  }
} catch (e) {
  console.error(e.message);
}
