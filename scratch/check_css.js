const fs = require('fs');
const iframe = fs.readFileSync('scratch/iframe_template.html', 'utf8');

// check for field positions
const matches = iframe.match(/#nome_completo\s*\{[^}]+\}/);
console.log('nome_completo CSS in iframe:');
console.log(matches ? matches[0] : 'not found');
