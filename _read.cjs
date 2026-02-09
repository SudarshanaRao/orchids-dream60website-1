const fs = require('fs'); const path = process.argv[2]; process.stdout.write(fs.readFileSync(path, 'utf8')); 
