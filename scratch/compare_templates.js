const fs = require('fs');
const editor = fs.readFileSync('cnh-editor.html', 'utf8');
const iframe = fs.readFileSync('scratch/iframe_template.html', 'utf8');

console.log('cnh-editor.html length:', editor.length);
console.log('iframe_template.html length:', iframe.length);

// Check if iframe has background image
const iframeBg = iframe.match(/background-image:[^;]+/);
console.log('iframe background:', iframeBg ? iframeBg[0] : 'none');

const editorBg = editor.match(/background-image:[^;]+/);
console.log('editor background:', editorBg ? editorBg[0] : 'none');
