const fs = require('fs');
const content = fs.readFileSync('criar-cnh.html', 'utf8');
const start = content.indexOf('const W = 793, H = 1123');
console.log(content.slice(start, start + 3000));
