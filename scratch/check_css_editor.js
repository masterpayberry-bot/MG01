const fs = require('fs');
const editor = fs.readFileSync('cnh-editor.html', 'utf8');

const matches = editor.match(/#nome_completo\s*\{[^}]+\}/);
console.log('nome_completo CSS in editor:');
console.log(matches ? matches[0] : 'not found');
