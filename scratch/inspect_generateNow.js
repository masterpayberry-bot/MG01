const fs = require('fs');
const content = fs.readFileSync('criar-cnh.html', 'utf8');

// find generateNow function in criar-cnh.html
const start = content.indexOf('async function generateNow()');
const end = content.indexOf('function showToast', start);
console.log(content.slice(start, start + 3000));
