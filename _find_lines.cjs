const fs = require('fs');
const c = fs.readFileSync('C:/Users/info/orchids-projects/dream60website-1/src/backend/src/controllers/adminController.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('digit') || l.includes('accessCode') || l.includes('access_code') || l.match(/\\d\{/))
    console.log((i + 1) + ': ' + l);
});
