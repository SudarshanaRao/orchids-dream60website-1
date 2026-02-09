const fs = require('fs');
const file = process.argv[2];
const start = parseInt(process.argv[3] || '0');
const count = parseInt(process.argv[4] || '100');
const lines = fs.readFileSync(file, 'utf8').split('\n');
const total = lines.length;
console.log('TOTAL LINES: ' + total);
lines.slice(start, start + count).forEach((l, i) => {
  console.log((start + i + 1) + ': ' + l);
});
