const fs = require("fs");
const c = fs.readFileSync("src/components/AdminVoucherManagement.tsx", "utf8");
const lines = c.split("\n");
console.log("Total:", lines.length);
for (let i = 200; i < Math.min(350, lines.length); i++) {
  console.log((i + 1) + ": " + lines[i]);
}
