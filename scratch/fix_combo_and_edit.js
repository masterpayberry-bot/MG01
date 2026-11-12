const fs = require('fs');

console.log('=== INICIANDO APLICAÇÃO DAS CORREÇÕES ===');

// ========================================================
// 1. CORRIGIR criar-cnh.html
// ========================================================
let cnhHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/criar-cnh.html', 'utf8');

// A) Adicionar formatarMunicipioUfLimpo se não existir
if (!cnhHtml.includes('function formatarMunicipioUfLimpo')) {
    const funcFormat = `
function formatarMunicipioUfLimpo(input, candUf) {
    if (!input && !candUf) return '';
    let s = String(input || '').trim();
    const ufIn = String(candUf || '').trim();

    const estadoToSigla = {
        'ACRE': 'AC', 'ALAGOAS': 'AL', 'AMAPA': 'AP', 'AMAPÁ': 'AP',
        'AMAZONAS': 'AM', 'BAHIA': 'BA', 'CEARA': 'CE', 'CEARÁ': 'CE',
        'DISTRITO FEDERAL': 'DF', 'ESPIRITO SANTO': 'ES', 'ESPÍRITO SANTO': 'ES',
        'GOIAS': 'GO', 'GOIÁS': 'GO', 'MARANHAO': 'MA', 'MARANHÃO': 'MA',
        'MATO GROSSO': 'MT', 'MATO GROSSO DO SUL': 'MS', 'MINAS GERAIS': 'MG',
        'PARA': 'PA', 'PARÁ': 'PA', 'PARAIBA': 'PB', 'PARAÍBA': 'PB',
        'PARANA': 'PR', 'PARANÁ': 'PR', 'PERNAMBUCO': 'PE', 'PIAUI': 'PI',
        'PIAUÍ': 'PI', 'RIO DE JANEIRO': 'RJ', 'RIO GRANDE DO NORTE': 'RN',
        'RIO GRANDE DO SUL': 'RS', 'RONDONIA': 'RO', 'RONDÔNIA': 'RO',
        'RORAIMA': 'RR', 'SANTA CATARINA': 'SC', 'SAO PAULO': 'SP', 'SÃO PAULO': 'SP',
        'SERGIPE': 'SE', 'TOCANTINS': 'TO'
    };

    let ufSigla = '';
    if (ufIn) {
        let uNorm = ufIn.toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
        if (/^[A-Z]{2}$/.test(uNorm)) {
            ufSigla = uNorm;
        } else if (estadoToSigla[uNorm]) {
            ufSigla = estadoToSigla[uNorm];
        }
    }

    let parts = s.split(/[,–\\-\\/]+/).map(p => p.trim()).filter(Boolean);
    let cidade = parts[0] || '';
    let cMatch = cidade.match(/^(.*?)\\s+([A-Za-z]{2})$/);
    if (cMatch) {
        cidade = cMatch[1].trim();
        if (!ufSigla) ufSigla = cMatch[2].toUpperCase();
    }

    for (let i = 1; i < parts.length; i++) {
        let pNorm = parts[i].toUpperCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
        if (/^[A-Z]{2}$/.test(pNorm) && !ufSigla) {
            ufSigla = pNorm;
            break;
        }
        for (let est in estadoToSigla) {
            let estNorm = est.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
            if (pNorm === estNorm && !ufSigla) {
                ufSigla = estadoToSigla[est];
                break;
            }
        }
    }

    if (!ufSigla && s.match(/^(.*?)[,\\s–\\-\\/]+([A-Za-z]{2})$/)) {
        let m = s.match(/^(.*?)[,\\s–\\-\\/]+([A-Za-z]{2})$/);
        cidade = m[1].trim();
        ufSigla = m[2].toUpperCase();
    }

    if (cidade && ufSigla) {
        return cidade.toUpperCase() + ', ' + ufSigla;
    }
    return (s || ufIn).toUpperCase();
}
`;
    // Insert before generateComboProntuarioBlob
    cnhHtml = cnhHtml.replace('function generateComboProntuarioBlob(data) {', funcFormat + '\nfunction generateComboProntuarioBlob(data) {');
    console.log('formatarMunicipioUfLimpo inserida com sucesso em criar-cnh.html!');
}

// B) Ajustar generateComboProntuarioBlob dimensions & wait
cnhHtml = cnhHtml.replace(
    "ifr.style.cssText = 'position:fixed; right:0; bottom:0; width:1024px; height:1600px; border:none; z-index:-9999; opacity:0.01; pointer-events:none;';",
    "ifr.style.cssText = 'position:fixed; right:0; bottom:0; width:1100px; height:2800px; border:none; z-index:-9999; opacity:0.01; pointer-events:none;';"
);

// C) Atualizar initParamsSync em criar-cnh.html para restaurar foto e assinatura de forma blindada (localStorage, sessionStorage, Supabase)
const oldPhotoRestorePattern = /let savedFoto = window\._currentFotoBase64[\s\S]*?if \(savedAss\) \{[\s\S]*?\} catch\(ex\) \{\}\s*\}/;

const newPhotoRestoreBlock = `// ── RESTAURAÇÃO INFALÍVEL DE FOTO E ASSINATURA NO MODO EDIÇÃO ──
        let savedFoto = window._currentFotoBase64 ||
                        localStorage.getItem('happynation_foto_' + cnhId) ||
                        (cleanCpfParam ? localStorage.getItem('happynation_foto_' + cleanCpfParam) : null) ||
                        localStorage.getItem('happynation_foto_active') ||
                        localStorage.getItem('happynation_combo_foto') ||
                        sessionStorage.getItem('happynation_combo_foto');

        if (!savedFoto && mergedData.foto && !mergedData.foto.includes('eduardo_photo.png')) {
            savedFoto = mergedData.foto;
        }

        let savedAss = window._currentAssBase64 ||
                       localStorage.getItem('happynation_ass_' + cnhId) ||
                       (cleanCpfParam ? localStorage.getItem('happynation_ass_' + cleanCpfParam) : null);

        if (!savedAss && mergedData.assinatura) {
            savedAss = mergedData.assinatura;
        }

        function renderFotoNoEditor(fB64) {
            if (!fB64) return;
            window._currentFotoBase64 = fB64;
            try {
                sessionStorage.setItem('happynation_combo_foto', fB64);
                localStorage.setItem('happynation_combo_foto', fB64);
                if (cnhId) localStorage.setItem('happynation_foto_' + cnhId, fB64);
                localStorage.setItem('happynation_foto_active', fB64);
            } catch(e) {}
            try {
                const fotoArea = doc.getElementById('foto-area');
                if (fotoArea) {
                    fotoArea.innerHTML = '<img src="' + fB64 + '" alt="Foto" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"/>';
                }
            } catch(ex) {}
        }

        function renderAssNoEditor(aB64) {
            if (!aB64) return;
            window._currentAssBase64 = aB64;
            try {
                if (cnhId) localStorage.setItem('happynation_ass_' + cnhId, aB64);
            } catch(e) {}
            try {
                const assArea = doc.getElementById('assinatura-area');
                if (assArea) {
                    assArea.innerHTML = '<img src="' + aB64 + '" alt="Assinatura" style="width:100%;height:100%;object-fit:contain;display:block;"/>';
                }
            } catch(ex) {}
        }

        if (savedFoto) renderFotoNoEditor(savedFoto);
        if (savedAss) renderAssNoEditor(savedAss);

        // Busca complementar em Supabase Cloud se faltar foto ou assinatura no modo edição
        (async function fetchSupabaseEditData() {
            try {
                const targetCpf = (params.get('cpf') || mergedData.cpf || '').replace(/\\D/g, '');
                const targetId = params.get('id') || mergedData.id || '';
                if (!targetCpf && !targetId) return;

                const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
                const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';
                const res = await fetch(\`\${SUP_URL}/rest/v1/cnhs?select=*\`, {
                    headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                });
                if (res.ok) {
                    const list = await res.json();
                    if (Array.isArray(list)) {
                        const rec = list.find(x => (targetId && String(x.id) === String(targetId)) || (targetCpf && (x.cpf||'').replace(/\\D/g, '') === targetCpf));
                        if (rec) {
                            const dj = rec.dados_json ? (typeof rec.dados_json === 'string' ? JSON.parse(rec.dados_json) : rec.dados_json) : (rec.dados || {});
                            const supFoto = dj.foto || rec.foto || (dj.slide1 && dj.slide1.startsWith('data:') ? dj.slide1 : null);
                            const supAss = dj.assinatura || rec.assinatura;

                            if (supFoto && !window._currentFotoBase64) renderFotoNoEditor(supFoto);
                            if (supAss && !window._currentAssBase64) renderAssNoEditor(supAss);

                            // Restaura campos vazios
                            if (!doc.getElementById('nome_completo')?.value && (rec.nome_cnh || dj.nome)) setField('nome_completo', rec.nome_cnh || dj.nome);
                            if (!doc.getElementById('cpf')?.value && (rec.cpf || dj.cpf)) setField('cpf', rec.cpf || dj.cpf);
                            if (!doc.getElementById('registro')?.value && (dj.reg || dj.registro)) setField('registro', dj.reg || dj.registro);
                            if (!doc.getElementById('doc_identidade')?.value && (dj.rg || dj.doc_identidade)) setField('doc_identidade', dj.rg || dj.doc_identidade);
                            if (!doc.getElementById('validade')?.value && dj.validade) setField('validade', dj.validade);
                            if (!doc.getElementById('data_emissao')?.value && (dj.emissao || dj.data_emissao)) setField('data_emissao', dj.emissao || dj.data_emissao);
                            if (!doc.getElementById('habilitacao')?.value && (dj.hab || dj.habilitacao)) setField('habilitacao', dj.hab || dj.habilitacao);
                            if (!doc.getElementById('filiacao_1')?.value && (dj.pai || dj.filiacao_1)) setField('filiacao_1', dj.pai || dj.filiacao_1);
                            if (!doc.getElementById('filiacao_2')?.value && (dj.mae || dj.filiacao_2)) setField('filiacao_2', dj.mae || dj.filiacao_2);
                            if (!doc.getElementById('local')?.value && dj.local) setField('local', dj.local);
                            if (!doc.getElementById('uf')?.value && dj.uf) setField('uf', dj.uf);
                            if (!doc.getElementById('observacoes')?.value && dj.observacoes) setField('observacoes', dj.observacoes);
                        }
                    }
                }
            } catch(eSup) {
                console.warn('Erro ao restaurar dados do Supabase na edição:', eSup);
            }
        })();`;

// Ensure cleanCpfParam is defined in initParamsSync
if (!cnhHtml.includes('const cleanCpfParam =')) {
    cnhHtml = cnhHtml.replace(
        "const cpfParam = params.get('cpf') || '';",
        "const cpfParam = params.get('cpf') || '';\n        const cleanCpfParam = cpfParam.replace(/\\D/g, '');"
    );
}

cnhHtml = cnhHtml.replace(oldPhotoRestorePattern, newPhotoRestoreBlock);

// D) Garantir que quando o iframe terminar de carregar (onload), foto e assinatura prévias sejam reinjetadas
const reInjectSnippet = `
        // Se houver foto/assinatura em memória ou storage no modo edição, reinjeta no iframe
        if (window._currentFotoBase64) {
            try {
                const fa = f.contentDocument ? f.contentDocument.getElementById('foto-area') : null;
                if (fa && !fa.querySelector('img')) {
                    fa.innerHTML = '<img src="' + window._currentFotoBase64 + '" alt="Foto" style="width:100%;height:100%;object-fit:cover;object-position:center top;display:block;"/>';
                }
            } catch(eFa) {}
        }
        if (window._currentAssBase64) {
            try {
                const aa = f.contentDocument ? f.contentDocument.getElementById('assinatura-area') : null;
                if (aa && !aa.querySelector('img')) {
                    aa.innerHTML = '<img src="' + window._currentAssBase64 + '" alt="Assinatura" style="width:100%;height:100%;object-fit:contain;display:block;"/>';
                }
            } catch(eAa) {}
        }
`;

if (!cnhHtml.includes('// Se houver foto/assinatura em memória ou storage no modo edição, reinjeta no iframe')) {
    cnhHtml = cnhHtml.replace('populateSidebarFromIframe();\n        };', 'populateSidebarFromIframe();\n' + reInjectSnippet + '        };');
}

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/criar-cnh.html', cnhHtml, 'utf8');
console.log('criar-cnh.html atualizado!');

// ========================================================
// 2. CORRIGIR criar-prontuario.html (html2canvas allowTaint & placeholder foto)
// ========================================================
let pronHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/criar-prontuario.html', 'utf8');

// Replace external unsplash image with transparent 1x1 base64 so it never taints canvas
pronHtml = pronHtml.replace(
    'src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"',
    'src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"'
);

// In gerarPdfProntuarioBlob, use allowTaint: false so toDataURL never throws SecurityError
pronHtml = pronHtml.replace(/scale:\s*3,\s*useCORS:\s*true,\s*allowTaint:\s*true/g, 'scale: 3, useCORS: true, allowTaint: false');

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/criar-prontuario.html', pronHtml, 'utf8');
console.log('criar-prontuario.html atualizado!');

// ========================================================
// 3. CORRIGIR cnh.html (loadUserCnhs preservando foto e assinatura de dados_json)
// ========================================================
let cnhListHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/cnh.html', 'utf8');

cnhListHtml = cnhListHtml.replace(
    "foto: item.foto || localStorage.getItem('happynation_foto_' + idStr) || null,",
    "foto: item.foto || (parsedDados && parsedDados.foto) || localStorage.getItem('happynation_foto_' + idStr) || null,"
);

cnhListHtml = cnhListHtml.replace(
    "assinatura: item.assinatura || localStorage.getItem('happynation_ass_' + idStr) || null,",
    "assinatura: item.assinatura || (parsedDados && parsedDados.assinatura) || localStorage.getItem('happynation_ass_' + idStr) || null,"
);

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/cnh.html', cnhListHtml, 'utf8');
console.log('cnh.html atualizado!');

// ========================================================
// 4. CORRIGIR admin.html (Adicionar editarCnhAdmin)
// ========================================================
let adminHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/admin.html', 'utf8');

// Update button in renderCnhsTable to call editarCnhAdmin
adminHtml = adminHtml.replace(
    `<button class="btn-act" onclick="window.location.href='criar-cnh.html?id=\${encodeURIComponent(c.id)}&cpf=\${encodeURIComponent(c.cpf)}&nome=\${encodeURIComponent(c.nomeCnh)}'">Visualizar</button>`,
    `<button class="btn-act" onclick="editarCnhAdmin('\${c.id}')">Editar</button>`
);

if (!adminHtml.includes('function editarCnhAdmin')) {
    const editAdminFunc = `
        function editarCnhAdmin(cnhId) {
            const c = (cnhsData && Array.isArray(cnhsData)) ? cnhsData.find(x => String(x.id) === String(cnhId)) : null;
            if (!c) {
                window.location.href = 'criar-cnh.html?id=' + encodeURIComponent(cnhId);
                return;
            }
            const cleanCpf = (c.cpf || '').replace(/\\D/g, '');
            const dj = (c.dados && typeof c.dados === 'object') ? c.dados : ((typeof c.dados_json === 'string') ? JSON.parse(c.dados_json || '{}') : (c.dados || {}));
            const fotoB64 = c.foto || dj.foto || localStorage.getItem('happynation_foto_' + cnhId) || (cleanCpf ? localStorage.getItem('happynation_foto_' + cleanCpf) : null);
            const assB64 = c.assinatura || dj.assinatura || localStorage.getItem('happynation_ass_' + cnhId) || (cleanCpf ? localStorage.getItem('happynation_ass_' + cleanCpf) : null);

            if (fotoB64) {
                try {
                    localStorage.setItem('happynation_foto_' + cnhId, fotoB64);
                    localStorage.setItem('happynation_foto_active', fotoB64);
                    sessionStorage.setItem('happynation_combo_foto', fotoB64);
                    localStorage.setItem('happynation_combo_foto', fotoB64);
                } catch(e) {}
            }
            if (assB64) {
                try {
                    localStorage.setItem('happynation_ass_' + cnhId, assB64);
                } catch(e) {}
            }

            const record = Object.assign({}, dj, c, {
                id: cnhId,
                foto: fotoB64,
                assinatura: assB64,
                dados: Object.assign({}, dj, { foto: fotoB64, assinatura: assB64 })
            });

            try {
                sessionStorage.setItem('happynation_edit_cnh', JSON.stringify(record));
                localStorage.setItem('happynation_edit_cnh', JSON.stringify(record));
            } catch(e) {}

            const q = new URLSearchParams();
            q.set('id', cnhId);
            if (c.cpf) q.set('cpf', c.cpf);
            if (c.nome || c.nomeCnh) q.set('nome', c.nome || c.nomeCnh);
            if (c.categoria || c.cat) q.set('cat', c.categoria || c.cat);
            window.location.href = 'criar-cnh.html?' + q.toString();
        }
`;
    adminHtml = adminHtml.replace('function deleteCnhAdmin(cnhId, cpf) {', editAdminFunc + '\n        function deleteCnhAdmin(cnhId, cpf) {');
    console.log('editarCnhAdmin inserida em admin.html!');
}

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/admin.html', adminHtml, 'utf8');
console.log('admin.html atualizado!');

// ========================================================
// 5. CORRIGIR ver-cnh.html (botão de download do Prontuário se foi gerado via combo)
// ========================================================
let verHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/ver-cnh.html', 'utf8');

// Adicionar suporte na tela de sucesso caso venha do combo
if (!verHtml.includes('btnDownloadProntuarioCombo')) {
    const comboVerSnippet = `
    // Se veio de geração com Combo de Prontuário, exibe botão de download dedicado
    try {
        const uParams = new URLSearchParams(window.location.search);
        if (uParams.get('combo_prontuario') === '1') {
            const btnContainer = document.querySelector('.action-buttons') || document.querySelector('.cnh-actions') || document.body;
            if (btnContainer && !document.getElementById('btnDownloadProntuarioCombo')) {
                const btnPron = document.createElement('a');
                btnPron.id = 'btnDownloadProntuarioCombo';
                btnPron.className = 'btn-cnh btn-prontuario-pill';
                btnPron.style.cssText = 'display:inline-flex; align-items:center; gap:8px; background:#00dc82; color:#062517; font-weight:800; font-size:13.5px; padding:12px 20px; border-radius:10px; text-decoration:none; margin-top:10px; cursor:pointer; box-shadow:0 0 15px rgba(0,220,130,0.3);';
                btnPron.innerHTML = '📄 Baixar Prontuário DETRAN (PDF)';
                btnPron.onclick = function(e) {
                    e.preventDefault();
                    window.open('criar-prontuario.html?nome=' + encodeURIComponent(found.nome||'') + '&cpf=' + encodeURIComponent(found.cpf||'') + '&autoDownload=true', '_blank');
                };
                btnContainer.appendChild(btnPron);
            }
        }
    } catch(eCombPron) {}
`;
    verHtml = verHtml.replace('// 3. Atualiza Card 1: Dados da CNH', comboVerSnippet + '\n    // 3. Atualiza Card 1: Dados da CNH');
    fs.writeFileSync('C:/Users/MG/Desktop/htdocs/ver-cnh.html', verHtml, 'utf8');
    console.log('ver-cnh.html atualizado com botão de prontuário!');
}

console.log('=== TODAS AS ATUALIZAÇÕES FORAM APLICADAS COM SUCESSO ===');
