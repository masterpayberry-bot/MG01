const fs = require('fs');
const content = fs.readFileSync('app/index.html', 'utf8');
const lines = content.split('\n');
for (let i = 2780; i < 2940; i++) {
  if (lines[i].includes('html2canvas') || lines[i].includes('drawImage') || lines[i].includes('addImage')) {
    console.log((i+1) + ': ' + lines[i].trim());
  }
}
