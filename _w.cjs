var fs=require('fs');var p=process.argv[2];var c=fs.readFileSync(0,'utf8');fs.writeFileSync(p,c);console.log('wrote '+p);
