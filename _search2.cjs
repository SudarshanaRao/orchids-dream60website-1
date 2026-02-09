const fs = require('fs');
const file = process.argv[2];
const pattern = process.argv[3];
const c = fs.readFileSync(file, 'utf8').split('\n');
const re = new RegExp(pattern, 'i');
c.forEach((l, i) => {
  if (re.test(l)) console.log((i + 1) + ': ' + l.trimEnd());
});
