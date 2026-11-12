const fs = require('fs');
const s = fs.readFileSync('C:/Users/MG/Desktop/htdocs/criar-cnh.html', 'utf8');

// Search for photo and signature handling in criar-cnh.html
const lines = s.split('\n');
lines.forEach((l, i) => {
  if (l.includes('_currentFotoBase64') || l.includes('_currentAssBase64') || l.includes('foto-area') || l.includes('assinatura-area') || l.includes('foto_') || l.includes('ass_')) {
    console.log(`Line ${i+1}: ${l.trim().slice(0, 100)}`);
  }
});
