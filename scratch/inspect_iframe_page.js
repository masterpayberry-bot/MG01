const fs = require('fs');
const iframe = fs.readFileSync('scratch/iframe_template.html', 'utf8');

// Let's check #page inside iframe_template.html
console.log('iframe #page styles:');
const pageMatch = iframe.match(/#page\s*\{[^}]+\}/);
console.log(pageMatch ? pageMatch[0] : 'not found');

// Let's check children of #page
const pageStart = iframe.indexOf('<div id="page">');
const pageEnd = iframe.indexOf('</div>', pageStart);
console.log('Direct content inside #page:');
console.log(iframe.slice(pageStart, pageStart + 500));
