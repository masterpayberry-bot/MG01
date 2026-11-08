const fs = require('fs');
const content = fs.readFileSync('cnh-editor.html', 'utf8');
const lines = content.split('\n');
console.log('Total lines in cnh-editor.html:', lines.length);
lines.slice(0, 100).forEach((l, i) => {
  if (l.includes('page') || l.includes('header') || l.includes('svg')) {
    console.log((i+1) + ': ' + l.trim().slice(0, 100));
  }
});
