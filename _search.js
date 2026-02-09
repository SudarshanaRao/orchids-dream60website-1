const fs = require('fs');
const c = fs.readFileSync('src/backend/src/controllers/schedulerController.js', 'utf8');
const lines = c.split('\n');
lines.forEach((l, i) => {
  if (l.includes('getDailyAuction')) console.log((i + 1) + ': ' + l);
});
