import { readFileSync } from 'fs';
const path = process.argv[2];
const pattern = process.argv[3];
const c = readFileSync(path, 'utf8');
const lines = c.split('\n');
const re = new RegExp(pattern, 'i');
lines.forEach((l, i) => {
  if (re.test(l)) console.log((i + 1) + ': ' + l.trimEnd());
});
