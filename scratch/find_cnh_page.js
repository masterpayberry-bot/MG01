const fs = require('fs');
const content = fs.readFileSync('criar-cnh.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('cnh-page')) {
    console.log((i+1) + ': ' + l.trim().slice(0, 100));
  }
});
