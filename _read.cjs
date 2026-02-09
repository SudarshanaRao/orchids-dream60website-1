const fs = require('fs');
const file = process.argv[2];
const start = parseInt(process.argv[3] || '0');
const count = parseInt(process.argv[4] || '99999');
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log('TOTAL_LINES:', lines.length);
lines.slice(start, start + count).forEach((l, i) => {
  console.log((start + i + 1) + ': ' + l);
});
