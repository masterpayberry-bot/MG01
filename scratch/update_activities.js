const fs = require('fs');
let code = fs.readFileSync('C:/Users/MG/Desktop/htdocs/admin.html', 'utf8');

// 1. Add .badge-saldo in CSS if not present
if (!code.includes('.badge-saldo')) {
    code = code.replace(
        '.badge-user { background: rgba(236, 72, 153, 0.18); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }',
        '.badge-user { background: rgba(236, 72, 153, 0.18); color: #f472b6; border: 1px solid rgba(236, 72, 153, 0.4); }\n        .badge-saldo { background: rgba(0, 220, 130, 0.18); color: #00dc82; border: 1px solid rgba(0, 220, 130, 0.4); }'
    );
}

// 2. Update logAdminActivity function signature to accept extras
code = code.replace(
    'function logAdminActivity(tipo, descricao, usuario, valor, status) {',
    'function logAdminActivity(tipo, descricao, usuario, valor, status, extras) {'
);

const oldItem = '            acts.unshift({\n                tipo: tipo,           // \'cnh\' | \'saldo\' | \'recarga\'\n                descricao: descricao, // ex: "JEREMIAS BARBOSA"\n                usuario: usuario,     // nome do cliente/user\n                valor: valor,         // ex: "- R$ 26,00" ou "+ R$ 100,00"\n                status: status || \'concluido\', // \'concluido\' | \'pendente\'\n                created_at: new Date().toISOString()\n            });';

const newItem = '            const newAct = {\n                tipo: tipo,\n                descricao: descricao,\n                usuario: usuario,\n                valor: valor,\n                status: status || \'concluido\',\n                created_at: new Date().toISOString()\n            };\n            if (extras && typeof extras === \'object\') {\n                Object.assign(newAct, extras);\n            }\n            acts.unshift(newAct);';

if (code.includes(oldItem)) {
    code = code.replace(oldItem, newItem);
}

// 3. Update confirmAddSaldo logAdminActivity call
code = code.replace(
    /logAdminActivity\(\s*'saldo',\s*'Adicionado pelo Admin',\s*activeUserForSaldo\.nome,\s*`\+ R\$ \$\{amount\.toFixed\(2\)\.replace\('\.', ','\)\}`,\s*'concluido'\s*\);/,
    `logAdminActivity(
                'saldo',
                'Adicionado pelo Admin',
                activeUserForSaldo.nome,
                \`+ R$ \${amount.toFixed(2).replace('.', ',')}\`,
                'concluido',
                {
                    subRotulo: 'Recarga Manual (Admin)',
                    tagClass: 'badge-saldo',
                    tagText: 'SALDO',
                    cor: '#00dc82'
                }
            );`
);

// 4. Update the render mapping
const targetSnippet = "const _tipo = a.tipo || '';";
const idx = code.indexOf(targetSnippet);
if (idx !== -1) {
    const endSnippet = "const acaoHtml =";
    const endIdx = code.indexOf(endSnippet, idx);
    if (endIdx !== -1) {
        const replacement = `const _tipo = a.tipo || '';
                const subRot = a.subRotulo || (
                    _tipo === 'cnh'            ? 'CNH Digital' :
                    _tipo === 'atestado_unimed'? 'Atestado Médico (Unimed)' :
                    _tipo === 'atestado_upa'   ? 'Atestado Médico (UPA 24h)' :
                    _tipo === 'atestado'       ? 'Atestado Médico' :
                    _tipo === 'exame'          ? 'Exame Toxicológico (DETRAN)' :
                    _tipo === 'prontuario'     ? 'Prontuário DETRAN' :
                    _tipo === 'rg'             ? 'Carteira de Identidade (RG)' :
                    _tipo === 'diploma'        ? 'Diploma Universitário' :
                    _tipo === 'crlv'           ? 'Documento Veicular (CRLV)' :
                    _tipo === 'mp' || _tipo === 'comprovante' ? 'Comprovante Mercado Pago' :
                    _tipo === 'saldo'          ? 'Recarga Manual (Admin)' :
                    _tipo === 'recarga'        ? 'Recarga de Saldo (PIX)' :
                    _tipo === 'cadastro'       ? 'Novo Cliente Cadastrado' :
                    'Documento'
                );
                const tagCls = a.tagClass || (
                    _tipo === 'cnh'            ? 'badge-cnh' :
                    _tipo === 'atestado_unimed'? 'badge-unimed' :
                    _tipo === 'atestado_upa'   ? 'badge-upa' :
                    _tipo === 'atestado'       ? 'badge-upa' :
                    _tipo === 'exame'          ? 'badge-exame' :
                    _tipo === 'prontuario'     ? 'badge-pron' :
                    _tipo === 'rg'             ? 'badge-rg' :
                    _tipo === 'diploma'        ? 'badge-diploma' :
                    _tipo === 'crlv'           ? 'badge-crlv' :
                    _tipo === 'mp' || _tipo === 'comprovante' ? 'badge-mp' :
                    _tipo === 'saldo'          ? 'badge-saldo' :
                    _tipo === 'recarga'        ? 'badge-pix' :
                    _tipo === 'cadastro'       ? 'badge-user' :
                    'badge-upa'
                );
                const tagTxt = a.tagText || (
                    _tipo === 'cnh'            ? 'CNH' :
                    _tipo === 'atestado_unimed'? 'UNIMED' :
                    _tipo === 'atestado_upa'   ? 'UPA 24H' :
                    _tipo === 'atestado'       ? 'ATESTADO' :
                    _tipo === 'exame'          ? 'TOXICOLÓGICO' :
                    _tipo === 'prontuario'     ? 'PRONTUÁRIO' :
                    _tipo === 'rg'             ? 'RG DIGITAL' :
                    _tipo === 'diploma'        ? 'DIPLOMA' :
                    _tipo === 'crlv'           ? 'CRLV' :
                    _tipo === 'mp' || _tipo === 'comprovante' ? 'MERCADO PAGO' :
                    _tipo === 'saldo'          ? 'SALDO' :
                    _tipo === 'recarga'        ? 'PIX' :
                    _tipo === 'cadastro'       ? 'CLIENTE' :
                    'DOCUMENTO'
                );
                const cor = a.cor || (
                    _tipo === 'atestado_unimed'? '#00d67d' :
                    _tipo === 'atestado_upa'   ? '#38bdf8' :
                    _tipo === 'atestado'       ? '#38bdf8' :
                    _tipo === 'exame'          ? '#fbbf24' :
                    _tipo === 'prontuario'     ? '#facc15' :
                    _tipo === 'rg'             ? '#34d399' :
                    _tipo === 'diploma'        ? '#818cf8' :
                    _tipo === 'crlv'           ? '#10b981' :
                    _tipo === 'mp' || _tipo === 'comprovante' ? '#009ee3' :
                    _tipo === 'saldo'          ? '#00dc82' :
                    _tipo === 'recarga'        ? '#c084fc' :
                    _tipo === 'cadastro'       ? '#f472b6' :
                    '#00dc82'
                );

                `;
        code = code.substring(0, idx) + replacement + code.substring(endIdx);
    }
}

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/admin.html', code, 'utf8');
console.log('Update complete via Node.js');
