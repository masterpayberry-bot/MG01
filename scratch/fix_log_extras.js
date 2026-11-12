const fs = require('fs');
let code = fs.readFileSync('C:/Users/MG/Desktop/htdocs/admin.html', 'utf8');

const target = `        function logAdminActivity(tipo, descricao, usuario, valor, status, extras) {
            let acts = [];
            try { acts = JSON.parse(localStorage.getItem(ADMIN_ACTS_KEY) || '[]'); } catch(e) {}
            acts.unshift({
                tipo: tipo,           // 'cnh' | 'saldo' | 'recarga'
                descricao: descricao, // ex: "JEREMIAS BARBOSA"
                usuario: usuario,     // nome do cliente/user
                valor: valor,         // ex: "- R$ 26,00" ou "+ R$ 100,00"
                status: status || 'concluido', // 'concluido' | 'pendente'
                created_at: new Date().toISOString()
            });`;

const replacement = `        function logAdminActivity(tipo, descricao, usuario, valor, status, extras) {
            let acts = [];
            try { acts = JSON.parse(localStorage.getItem(ADMIN_ACTS_KEY) || '[]'); } catch(e) {}
            const newAct = {
                tipo: tipo,           // 'cnh' | 'saldo' | 'recarga'
                descricao: descricao, // ex: "JEREMIAS BARBOSA"
                usuario: usuario,     // nome do cliente/user
                valor: valor,         // ex: "- R$ 26,00" ou "+ R$ 100,00"
                status: status || 'concluido', // 'concluido' | 'pendente'
                created_at: new Date().toISOString()
            };
            if (extras && typeof extras === 'object') {
                Object.assign(newAct, extras);
            }
            acts.unshift(newAct);`;

// Normalize crlf
const normCode = code.replace(/\r\n/g, '\n');
const normTarget = target.replace(/\r\n/g, '\n');
const normReplacement = replacement.replace(/\r\n/g, '\n');

if (normCode.includes(normTarget)) {
    const updated = normCode.replace(normTarget, normReplacement);
    fs.writeFileSync('C:/Users/MG/Desktop/htdocs/admin.html', updated, 'utf8');
    console.log('Successfully updated logAdminActivity with extras!');
} else {
    console.log('Target not found in normalized code');
}
