const fs = require('fs');
const targetPath = process.argv[2];
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
