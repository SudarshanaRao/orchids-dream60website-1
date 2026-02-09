const fs = require('fs');
const path = require('path');
function scan(dir) {
  fs.readdirSync(dir).forEach(item => {
    const fp = path.join(dir, item);
    if (fs.statSync(fp).isDirectory() && !item.includes('node_modules')) {
      scan(fp);
    } else if (fp.endsWith('.js') && !item.startsWith('_')) {
      const content = fs.readFileSync(fp, 'utf8');
      content.split('\n').forEach((line, idx) => {
        if (
          (line.includes('userType') && line.includes('ADMIN')) ||
          (line.includes('isSuperAdmin') && !line.includes('//'))
        ) {
          console.log(fp + ':' + (idx + 1) + ': ' + line.trim());
        }
      });
    }
  });
}
scan(path.join(__dirname, 'src'));
