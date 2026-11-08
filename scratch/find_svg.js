const fs = require('fs');
const content = fs.readFileSync('cnh-editor.html', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('<svg') || l.includes('data:image/svg')) {
    console.log((i+1) + ': ' + l.trim().slice(0, 100));
  }
});
