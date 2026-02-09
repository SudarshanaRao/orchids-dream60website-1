import fs from 'fs';
const c = fs.readFileSync('src/App.tsx', 'utf8');
fs.writeFileSync('_dump.txt', c);
console.log('Done, length:', c.length);
