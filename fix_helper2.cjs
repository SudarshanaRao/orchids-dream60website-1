const fs = require('fs'); 
const p = 'C:/Users/info/orchids-projects/dream60website-1/src/components/AdminVoucherManagement.tsx'; 
const c = fs.readFileSync(p, 'utf8'); 
const idx = c.indexOf('const [showConfirmModal'); 
const nextLine = c.indexOf('\n', idx); 
console.log('Found showConfirmModal at char: ' + idx); 
console.log('Context: ' + c.substring(idx, nextLine + 1));
