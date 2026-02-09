const fs = require(\"fs\");  
const p = \"C:/Users/info/orchids-projects/dream60website-1/src/components/AdminVoucherManagement.tsx\";  
const c = fs.readFileSync(p, \"utf8\");  
console.log(\"Lines: \" + c.split(\"\n\").length);  
