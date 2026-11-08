const fs = require('fs');
const app = fs.readFileSync('app/index.html', 'utf8');
const criar = fs.readFileSync('criar-cnh.html', 'utf8');

const appFields = app.slice(app.indexOf('// 4) Textos e campos da CNH'), app.indexOf('const imgData = canvas.toDataURL'));
const criarFields = criar.slice(criar.indexOf('// 3) Textos e campos'), criar.indexOf('const imgData = canvas.toDataURL'));

console.log('--- APP FIELDS ---');
console.log(appFields.slice(0, 500));
console.log('--- CRIAR FIELDS ---');
console.log(criarFields.slice(0, 500));
