const fs = require('fs');
const path = require('path');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory() && e.name !== 'node_modules') {
      walk(full);
    } else if (e.isFile() && (e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) {
      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes('localStorage') || line.includes('sessionStorage')) {
          console.log(full + ':' + (i + 1) + ': ' + line.trim());
        }
      });
    }
  }
}

walk('src');
