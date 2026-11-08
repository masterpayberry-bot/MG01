const fs = require('fs');
const content = fs.readFileSync('criar-cnh.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('page') && (l.includes('getElementById') || l.includes('querySelector') || l.includes('id='))) {
    console.log((i+1) + ': ' + l.trim().slice(0, 100));
  }
});
