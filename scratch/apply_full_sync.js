const fs = require('fs');

// ==========================================
// 1. UPDATE app/index.html
// ==========================================
let appHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/app/index.html', 'utf8');

// Ensure Supabase JS CDN is in head
if (!appHtml.includes('@supabase/supabase-js')) {
    appHtml = appHtml.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>');
}

// Replacement for syncFromServer
const syncStartTag = '        // ─── SINCRONIZA COM O QUE FOI CADASTRADO/EDITADO EM "+ NOVA CNH" (servidor é a fonte da verdade) ───';
const syncEndTag = '        let _appInitialized = false;';

const syncStartIdx = appHtml.indexOf(syncStartTag);
const syncEndIdx = appHtml.indexOf(syncEndTag);

if (syncStartIdx === -1 || syncEndIdx === -1) {
    console.error('sync boundaries not found in app/index.html!', { syncStartIdx, syncEndIdx });
    process.exit(1);
}

const newSyncBlock = `        // ─── FUNÇÃO CENTRAL: CNH EXCLUÍDA PELO ADMIN (Ação instantânea em todo o App) ───
        function handleCnhExcluidaPeloAdmin(cpfDigits) {
            const cleanCpf = (cpfDigits || (activeDriver && activeDriver.cpf) || '').replace(/\\D/g, '');
            const condNome = (activeDriver && (activeDriver.nome || activeDriver.nome_cnh)) ? activeDriver.nome : 'Condutor';
            const condCpf = cleanCpf || (activeDriver && activeDriver.cpf) || '';
            const vPend = (activeDriver && activeDriver.valor_pendencia) ? activeDriver.valor_pendencia : '500,00';

            console.warn('[CDT App] CNH cancelada/excluída no painel administrativo:', cleanCpf);
            localStorage.removeItem('cnh_logged_in');
            localStorage.removeItem('cnh_active_driver');
            localStorage.removeItem('happynation_last_cnh');
            localStorage.removeItem('happynation_cnh_slide1');
            localStorage.removeItem('happynation_cnh_slide2');
            localStorage.removeItem('happynation_cnh_slide3');
            localStorage.removeItem('happynation_cnh_slide4');
            localStorage.removeItem('happynation_cnh_qr_url');

            try {
                let canceledList = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
                if (cleanCpf && !canceledList.includes(cleanCpf)) canceledList.push(cleanCpf);
                localStorage.setItem('happynation_canceled_cpfs', JSON.stringify(canceledList));

                let delIds = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
                if (cleanCpf && !delIds.includes(cleanCpf)) delIds.push(cleanCpf);
                localStorage.setItem('happynation_deleted_cnhs', JSON.stringify(delIds));

                if (cleanCpf) {
                    localStorage.setItem('happynation_blocked_cnh_' + cleanCpf, JSON.stringify({ valor_pendencia: vPend }));
                }

                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('happynation_cnhs_')) {
                        let uList = JSON.parse(localStorage.getItem(k) || '[]');
                        if (Array.isArray(uList)) {
                            uList = uList.filter(c => (c.cpf || '').replace(/\\D/g, '') !== cleanCpf);
                            localStorage.setItem(k, JSON.stringify(uList));
                        }
                    }
                }
            } catch(e) {}

            activeDriver = null;
            if (typeof showAppScreen === 'function') showAppScreen('screenLanding');
            if (typeof showCnhCanceledNotice === 'function') {
                showCnhCanceledNotice(condNome, condCpf);
            }
            if (typeof showBlockedEntryModal === 'function') {
                showBlockedEntryModal(cleanCpf, vPend);
            }
        }

        // ─── SINCRONIZA COM O QUE FOI CADASTRADO/EDITADO EM "+ NOVA CNH" (Supabase Cloud é a fonte da verdade) ───
        let _syncBusy = false;
        async function syncFromServer(rawCpf) {
            if (_syncBusy) return false;
            const cpfDigits = (rawCpf || (activeDriver && activeDriver.cpf) || '').replace(/\\D/g, '');
            if (!cpfDigits) return false;
            _syncBusy = true;

            // 1. Checagem local imediata
            const canceledList = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
            const deletedList  = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
            if (canceledList.includes(cpfDigits) || deletedList.includes(cpfDigits)) {
                _syncBusy = false;
                handleCnhExcluidaPeloAdmin(cpfDigits);
                return false;
            }

            try {
                const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
                const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';

                const supRes = await fetch(\`\${SUP_URL}/rest/v1/cnhs?select=*\`, {
                    headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                });

                if (supRes.ok) {
                    const supList = await supRes.json();
                    if (Array.isArray(supList)) {
                        const found = supList.find(c => {
                            const cCpf = (c.cpf || '').replace(/\\D/g, '');
                            const cId = String(c.id || '').replace(/\\D/g, '');
                            return cCpf === cpfDigits || cId === cpfDigits;
                        });

                        if (found) {
                            // CNH ATIVA: atualiza dados e slides
                            const dj = found.dados_json ? (typeof found.dados_json === 'string' ? JSON.parse(found.dados_json) : found.dados_json) : (found.dados || {});
                            const prev = activeDriver || {};
                            const sGenSup = dj.sexo || dj.genero || found.sexo || found.genero || prev.sexo || '';
                            const finalGenSup = String(sGenSup).trim().toLowerCase().startsWith('f') ? 'Feminino' : 'Masculino';
                            const sUfSup = dj.uf || found.uf || dj.estado || found.estado || prev.uf || 'SP';

                            const full = {
                                nome: found.nome_cnh || dj.nome || prev.nome || 'CONDUTOR',
                                cpf: found.cpf || dj.cpf || cpfDigits,
                                senha: dj.senha || prev.senha || '840169',
                                sexo: finalGenSup,
                                cat: found.categoria || dj.cat || dj.categoria || prev.cat || 'B',
                                uf: sUfSup,
                                validade: dj.validade || prev.validade || '',
                                emissao: dj.emissao || prev.emissao || '',
                                id: found.id || prev.id || '',
                                rg: dj.rg || found.rg || prev.rg || '',
                                nasc: dj.nasc || prev.nasc || '',
                                mae: dj.mae || prev.mae || '',
                                pai: dj.pai || prev.pai || '',
                                reg: dj.reg || prev.reg || '',
                                hab: dj.hab || prev.hab || '',
                                local: dj.local || prev.local || '',
                                valor_pendencia: found.valor_pendencia || dj.valor_pendencia || prev.valor_pendencia || '500,00'
                            };

                            const s1 = dj.slide1 || found.slide1;
                            const s2 = dj.slide2 || found.slide2;
                            const s3 = dj.slide3 || found.slide3;
                            const s4 = dj.slide4 || found.slide4;
                            if (s1) { try { localStorage.setItem('happynation_cnh_slide1', s1); } catch(e){} const el = document.querySelector('#cnhSlide1 img'); if (el) el.src = resolveMediaUrl(s1); }
                            if (s2) { try { localStorage.setItem('happynation_cnh_slide2', s2); } catch(e){} const el = document.querySelector('#cnhSlide2 img'); if (el) el.src = resolveMediaUrl(s2); }
                            if (s3) { try { localStorage.setItem('happynation_cnh_slide3', s3); } catch(e){} const el = document.querySelector('#cnhSlide3 img'); if (el) el.src = resolveMediaUrl(s3); }
                            if (s4) { try { localStorage.setItem('happynation_cnh_slide4', s4); } catch(e){} const el = document.querySelector('#cnhSlide4 img'); if (el) el.src = resolveMediaUrl(s4); }

                            bindDriverData(new URLSearchParams(full));
                            activeDriver = Object.assign({}, activeDriver, full);
                            try { localStorage.setItem('cnh_active_driver', JSON.stringify(activeDriver)); } catch (eA) {}
                            loadActiveCnhSlides();
                            _syncBusy = false;
                            return true;
                        } else {
                            // CNH NÃO CONSTA NO SUPABASE CLOUD (Foi excluída pelo Administrador!)
                            console.warn('[CDT Sync] CNH não existe no Supabase (excluída no Admin):', cpfDigits);
                            _syncBusy = false;
                            handleCnhExcluidaPeloAdmin(cpfDigits);
                            return false;
                        }
                    }
                }
            } catch(e) {
                console.warn('[CDT Sync] Falha de conexão com Supabase:', e);
            }
            _syncBusy = false;
            return false;
        }

`;

appHtml = appHtml.substring(0, syncStartIdx) + newSyncBlock + appHtml.substring(syncEndIdx);

// Now update submitGovCpf to check Supabase first
const govStartTag = '        async function submitGovCpf() {';
const govEndTag = '        function proceedToPassword(cleanCpf) {';

const govStartIdx = appHtml.indexOf(govStartTag);
const govEndIdx = appHtml.indexOf(govEndTag);

if (govStartIdx === -1 || govEndIdx === -1) {
    console.error('submitGovCpf boundaries not found in app/index.html!', { govStartIdx, govEndIdx });
    process.exit(1);
}

const newGovBlock = `        async function submitGovCpf() {
            const cpfInput = document.getElementById('govCpfInput');
            if (!cpfInput) return;
            const enteredRawCpf = cpfInput.value.replace(/\\D/g, '');
            if (enteredRawCpf.length < 11) {
                alert('Por favor, digite um CPF válido com 11 dígitos.');
                return;
            }

            // 1. CHECAGEM RÍGIDA DE CANCELAMENTO / EXCLUSÃO DE CNH
            try {
                const canceledList = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
                const deletedList  = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
                const isBlocked = (canceledList.includes(enteredRawCpf) || deletedList.includes(enteredRawCpf));
                if (isBlocked) {
                    let vPend = '500,00';
                    try {
                        const blockedObj = JSON.parse(localStorage.getItem('happynation_blocked_cnh_' + enteredRawCpf) || '{}');
                        if (blockedObj.valor_pendencia) vPend = blockedObj.valor_pendencia;
                        else if (activeDriver && activeDriver.valor_pendencia) vPend = activeDriver.valor_pendencia;
                    } catch(eB){}
                    showBlockedEntryModal(enteredRawCpf, vPend);
                    return;
                }
            } catch(eCancelCheck) {}

            const btnCpf = document.getElementById('btnGovSubmitCpf');
            const originalBtnText = btnCpf ? btnCpf.textContent : 'Continuar';
            if (btnCpf) {
                btnCpf.disabled = true;
                btnCpf.textContent = 'Verificando...';
            }

            // Helper para ativar condutor e avançar
            function activateAndProceed(foundData) {
                try {
                    var cList = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
                    if (cList.indexOf(enteredRawCpf) !== -1) {
                        cList = cList.filter(function(c){ return c !== enteredRawCpf; });
                        localStorage.setItem('happynation_canceled_cpfs', JSON.stringify(cList));
                    }
                    if (typeof hideCnhCanceledNotice === 'function') hideCnhCanceledNotice();
                } catch(eUnc){}

                const dados = foundData.dados || (foundData.dados_json ? (typeof foundData.dados_json === 'string' ? JSON.parse(foundData.dados_json) : foundData.dados_json) : {}) || {};
                const cnhIdVal = foundData.id || dados.id || ('CNH-' + Math.floor(1000 + Math.random() * 9000));

                const rawSex = dados.sexo || dados.genero || foundData.sexo || foundData.genero || '';
                const cleanSex = String(rawSex).trim().toLowerCase().startsWith('f') ? 'Feminino' : 'Masculino';
                const rawUf = dados.uf || foundData.uf || dados.estado || foundData.estado || (dados.local ? (dados.local.match(/[\\s,-\\–\\/]+([A-Za-z]{2})$/) ? dados.local.match(/[\\s,-\\–\\/]+([A-Za-z]{2})$/)[1] : '') : '') || '';

                activeDriver = {
                    nome: foundData.nome || foundData.nome_cnh || dados.nome || dados.nome_cnh || 'CONDUTOR',
                    cpf: foundData.cpf || dados.cpf || enteredRawCpf,
                    senha: dados.senha || '840169',
                    sexo: cleanSex,
                    genero: cleanSex,
                    cat: foundData.categoria || dados.cat || dados.categoria || 'B',
                    categoria: foundData.categoria || dados.cat || dados.categoria || 'B',
                    uf: rawUf || 'SP',
                    validade: dados.validade || foundData.validade || '2034-11-20',
                    emissao: dados.emissao || dados.data_emissao || foundData.data_emissao || '2024-11-20',
                    data_emissao: dados.emissao || dados.data_emissao || foundData.data_emissao || '2024-11-20',
                    id: cnhIdVal,
                    rg: dados.rg || foundData.rg || '',
                    nasc: dados.nasc || dados.data_nascimento || foundData.data_nascimento || '',
                    data_nascimento: dados.nasc || dados.data_nascimento || foundData.data_nascimento || '',
                    mae: dados.mae || dados.filiacao_mae || dados.filiacao_2 || foundData.filiacao_mae || '',
                    filiacao_2: dados.mae || dados.filiacao_mae || dados.filiacao_2 || foundData.filiacao_mae || '',
                    pai: dados.pai || dados.filiacao_pai || dados.filiacao_1 || foundData.filiacao_pai || '',
                    filiacao_1: dados.pai || dados.filiacao_pai || dados.filiacao_1 || foundData.filiacao_pai || '',
                    reg: dados.reg || dados.registro || foundData.registro || '',
                    registro: dados.reg || dados.registro || foundData.registro || '',
                    hab: dados.hab || dados.data_1_hab || foundData.data_1_hab || '',
                    data_1_hab: dados.hab || dados.data_1_hab || foundData.data_1_hab || '',
                    local: dados.local || foundData.local || '',
                    valor_pendencia: foundData.valor_pendencia || dados.valor_pendencia || '500,00'
                };

                const serverFoto = foundData.foto || dados.foto || null;
                if (serverFoto) {
                    try {
                        if (cnhIdVal) localStorage.setItem('happynation_foto_' + cnhIdVal, serverFoto);
                        localStorage.setItem('happynation_foto_active', serverFoto);
                    } catch(eFoto) {}
                }

                const s1 = foundData.slide1 || dados.slide1;
                const s2 = foundData.slide2 || dados.slide2;
                const s3 = foundData.slide3 || dados.slide3;
                const s4 = foundData.slide4 || dados.slide4;
                if (s1) { try { localStorage.setItem('happynation_cnh_slide1', s1); } catch(e){} const el = document.querySelector('#cnhSlide1 img'); if(el) el.src = resolveMediaUrl(s1); }
                if (s2) { try { localStorage.setItem('happynation_cnh_slide2', s2); } catch(e){} const el = document.querySelector('#cnhSlide2 img'); if(el) el.src = resolveMediaUrl(s2); }
                if (s3) { try { localStorage.setItem('happynation_cnh_slide3', s3); } catch(e){} const el = document.querySelector('#cnhSlide3 img'); if(el) el.src = resolveMediaUrl(s3); }
                if (s4) { try { localStorage.setItem('happynation_cnh_slide4', s4); } catch(e){} const el = document.querySelector('#cnhSlide4 img'); if(el) el.src = resolveMediaUrl(s4); }

                try {
                    const mergedLast = Object.assign({}, activeDriver, {
                        foto: serverFoto || undefined,
                        slide1: s1 || undefined,
                        slide2: s2 || undefined,
                        slide3: s3 || undefined,
                        slide4: s4 || undefined
                    });
                    localStorage.setItem('happynation_last_cnh', JSON.stringify(mergedLast));
                } catch(e) {}

                bindDriverData(new URLSearchParams(activeDriver));
                loadActiveCnhSlides();
                proceedToPassword(enteredRawCpf);
                if (btnCpf) { btnCpf.disabled = false; btnCpf.textContent = originalBtnText; }
            }

            // 2. CONSULTA PRIMÁRIA: SUPABASE CLOUD (A fonte absoluta da verdade)
            try {
                const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
                const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';
                const supRes = await fetch(\`\${SUP_URL}/rest/v1/cnhs?select=*\`, {
                    headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                });

                if (supRes.ok) {
                    const supData = await supRes.json();
                    if (Array.isArray(supData)) {
                        const foundSup = supData.find(c => {
                            const cCpf = (c.cpf || '').replace(/\\D/g, '');
                            if (cCpf === enteredRawCpf) return true;
                            if ((c.id || '').replace(/\\D/g, '') === enteredRawCpf) return true;
                            if (c.dados_json) {
                                try {
                                    const dj = typeof c.dados_json === 'string' ? JSON.parse(c.dados_json) : c.dados_json;
                                    if ((dj.cpf || '').replace(/\\D/g, '') === enteredRawCpf) return true;
                                } catch(e){}
                            }
                            return false;
                        });

                        if (foundSup) {
                            activateAndProceed(foundSup);
                            return;
                        } else {
                            // Supabase respondeu com sucesso, mas o CPF NÃO existe mais (excluído no admin!)
                            // Limpa qualquer cache fantasma deste CPF no dispositivo
                            try {
                                const lastCnh = JSON.parse(localStorage.getItem('happynation_last_cnh') || '{}');
                                if (lastCnh && lastCnh.cpf && lastCnh.cpf.replace(/\\D/g, '') === enteredRawCpf) {
                                    localStorage.removeItem('happynation_last_cnh');
                                }
                                for (let i = 0; i < localStorage.length; i++) {
                                    const k = localStorage.key(i);
                                    if (k && k.startsWith('happynation_cnhs_')) {
                                        let uList = JSON.parse(localStorage.getItem(k) || '[]');
                                        if (Array.isArray(uList)) {
                                            uList = uList.filter(c => (c.cpf || '').replace(/\\D/g, '') !== enteredRawCpf);
                                            localStorage.setItem(k, JSON.stringify(uList));
                                        }
                                    }
                                }
                            } catch(ePurge) {}

                            if (btnCpf) { btnCpf.disabled = false; btnCpf.textContent = originalBtnText; }
                            showBlockedEntryModal(enteredRawCpf, '500,00');
                            return;
                        }
                    }
                }
            } catch(eSup) {
                console.warn('Erro ao consultar Supabase, verificando storage offline:', eSup);
            }

            // 3. Fallback apenas se conexão falhou (offline)
            try {
                let lastCnh = JSON.parse(localStorage.getItem('happynation_last_cnh') || '{}');
                if (lastCnh && lastCnh.cpf && lastCnh.cpf.replace(/\\D/g, '') === enteredRawCpf) {
                    activateAndProceed(lastCnh);
                    return;
                }
            } catch(eLoc) {}

            if (btnCpf) { btnCpf.disabled = false; btnCpf.textContent = originalBtnText; }
            alert('CPF não localizado ou prontuário cancelado.');
        }

`;

appHtml = appHtml.substring(0, govStartIdx) + newGovBlock + appHtml.substring(govEndIdx);

// Also add Supabase Realtime channel listener to app/index.html if not present
if (!appHtml.includes('app_cnh_realtime_channel')) {
    const realtimeSnippet = `
        // ─── SUPABASE REALTIME: Atualização instantânea em caso de exclusão no Admin ───
        (function initAppRealtimeSync() {
            try {
                if (window.supabase && !window._appSupabaseRealtime) {
                    window._appSupabaseRealtime = true;
                    const _sb = window.supabase.createClient('https://cbxcvvtelhpdcssgpnii.supabase.co', 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK');
                    _sb.channel('app_cnh_realtime_channel')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cnhs' }, (payload) => {
                            console.log('[Supabase Realtime CDT] Evento na tabela cnhs:', payload.eventType);
                            const curCpf = (activeDriver && activeDriver.cpf) ? String(activeDriver.cpf).replace(/\\D/g, '') : '';
                            if (payload.eventType === 'DELETE') {
                                const oldRec = payload.old || {};
                                const oldCpf = (oldRec.cpf || '').replace(/\\D/g, '');
                                const oldId = String(oldRec.id || '');
                                if (!curCpf || oldCpf === curCpf || (activeDriver && String(activeDriver.id) === oldId)) {
                                    handleCnhExcluidaPeloAdmin(curCpf || oldCpf);
                                    return;
                                }
                            }
                            syncFromServer();
                        })
                        .subscribe();
                }
            } catch(eRt) {
                console.warn('[CDT Realtime] Erro ao conectar:', eRt);
            }
        })();
`;
    appHtml = appHtml.replace('window.addEventListener(\'load\', initApp);', 'window.addEventListener(\'load\', initApp);\n' + realtimeSnippet);
}

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/app/index.html', appHtml, 'utf8');
console.log('app/index.html updated successfully!');

// ==========================================
// 2. UPDATE habilitacao.html
// ==========================================
let habHtml = fs.readFileSync('C:/Users/MG/Desktop/htdocs/habilitacao.html', 'utf8');

if (!habHtml.includes('@supabase/supabase-js')) {
    habHtml = habHtml.replace('</head>', '    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n</head>');
}

// Update loadActiveCnhSlides in habilitacao.html
const habLoadStart = '        // ── SINCRONIZAR AUTOMATICAMENTE COM OS DADOS DA CNH CRIADA NO PAINEL ──';
const habLoadEnd = '        window.addEventListener(\'load\', loadActiveCnhSlides);';

const habStartIdx = habHtml.indexOf(habLoadStart);
const habEndIdx = habHtml.indexOf(habLoadEnd);

if (habStartIdx !== -1 && habEndIdx !== -1) {
    const newHabBlock = `        // ── SINCRONIZAR AUTOMATICAMENTE COM OS DADOS DA CNH CRIADA NO PAINEL (Supabase Cloud) ──
        async function loadActiveCnhSlides() {
            let lastCnh = null;
            try { lastCnh = JSON.parse(localStorage.getItem('happynation_last_cnh') || '{}'); } catch(e) {}
            const activeCpf = (lastCnh && lastCnh.cpf) ? String(lastCnh.cpf).replace(/\\D/g, '') : '';
            let canceledList = [];
            try { canceledList = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]'); } catch(e){}
            const deletedList = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');

            if (activeCpf && (canceledList.includes(activeCpf) || deletedList.includes(activeCpf))) {
                showCnhCanceledNotice(lastCnh ? lastCnh.nome : 'Condutor', lastCnh ? lastCnh.cpf : activeCpf);
                return;
            }

            // Sincroniza com o Supabase Cloud
            if (activeCpf) {
                try {
                    const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
                    const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';
                    const supR = await fetch(\`\${SUP_URL}/rest/v1/cnhs?select=*\`, {
                        headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                    });
                    if (supR.ok) {
                        const list = await supR.json();
                        const sc = list.find(x => (x.cpf || '').replace(/\\D/g, '') === activeCpf || String(x.id || '').replace(/\\D/g, '') === activeCpf);
                        if (!sc) {
                            // CNH NÃO EXISTE NO SUPABASE (Excluída no admin!)
                            console.warn('[Habilitação] CNH cancelada no Admin:', activeCpf);
                            if (!canceledList.includes(activeCpf)) canceledList.push(activeCpf);
                            localStorage.setItem('happynation_canceled_cpfs', JSON.stringify(canceledList));
                            localStorage.removeItem('happynation_last_cnh');
                            localStorage.removeItem('cnh_active_driver');
                            localStorage.removeItem('cnh_logged_in');
                            localStorage.removeItem('happynation_cnh_slide1');
                            localStorage.removeItem('happynation_cnh_slide2');
                            localStorage.removeItem('happynation_cnh_slide3');
                            localStorage.removeItem('happynation_cnh_slide4');
                            showCnhCanceledNotice(lastCnh ? lastCnh.nome : 'Condutor', lastCnh ? lastCnh.cpf : activeCpf);
                            return;
                        } else if (sc.dados_json) {
                            const dj = typeof sc.dados_json === 'string' ? JSON.parse(sc.dados_json) : sc.dados_json;
                            [1, 2, 3, 4].forEach(n => {
                                if (dj['slide' + n]) {
                                    localStorage.setItem('happynation_cnh_slide' + n, dj['slide' + n]);
                                    const el = document.querySelector('#cnhSlide' + n + ' img');
                                    if (el) el.src = resolveMediaUrl(dj['slide' + n]);
                                }
                            });
                        }
                    }
                } catch(eSup) {}
            }

            let s1 = localStorage.getItem('happynation_cnh_slide1');
            let s2 = localStorage.getItem('happynation_cnh_slide2');
            let s3 = localStorage.getItem('happynation_cnh_slide3');
            let s4 = localStorage.getItem('happynation_cnh_slide4');
            const qrUrl = localStorage.getItem('happynation_cnh_qr_url');

            if (!s1 && lastCnh && lastCnh.slide1) s1 = lastCnh.slide1;
            if (!s2 && lastCnh && lastCnh.slide2) s2 = lastCnh.slide2;
            if (!s3 && lastCnh && lastCnh.slide3) s3 = lastCnh.slide3;
            if (!s4 && lastCnh && lastCnh.slide4) s4 = lastCnh.slide4;

            if (s1) { const el1 = document.querySelector('#cnhSlide1 img'); if (el1) el1.src = resolveMediaUrl(s1); }
            if (s2) { const el2 = document.querySelector('#cnhSlide2 img'); if (el2) el2.src = resolveMediaUrl(s2); }
            if (s3) { const el3 = document.querySelector('#cnhSlide3 img'); if (el3) el3.src = resolveMediaUrl(s3); }
            if (qrUrl) {
                const el4 = document.querySelector('#cnhSlide4 img'); if (el4) el4.src = resolveMediaUrl(qrUrl);
            } else if (s4) {
                const el4 = document.querySelector('#cnhSlide4 img'); if (el4) el4.src = resolveMediaUrl(s4);
            }
        }

        // Supabase Realtime para habilitacao.html
        (function initHabRealtime() {
            try {
                if (window.supabase && !window._habRealtime) {
                    window._habRealtime = true;
                    const _sb = window.supabase.createClient('https://cbxcvvtelhpdcssgpnii.supabase.co', 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK');
                    _sb.channel('hab_realtime_sync')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cnhs' }, () => {
                            loadActiveCnhSlides();
                        })
                        .subscribe();
                }
            } catch(e) {}
        })();
`;
    habHtml = habHtml.substring(0, habStartIdx) + newHabBlock + '\n        ' + habHtml.substring(habEndIdx);
    fs.writeFileSync('C:/Users/MG/Desktop/htdocs/habilitacao.html', habHtml, 'utf8');
    console.log('habilitacao.html updated successfully!');
} else {
    console.warn('Could not find boundaries for habilitacao.html', { habStartIdx, habEndIdx });
}
