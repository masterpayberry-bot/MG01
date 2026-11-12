const fs = require('fs');
let code = fs.readFileSync('C:/Users/MG/Desktop/htdocs/app/index.html', 'utf8');

const targetStart = '        async function syncFromServer(cpf) {';
const targetEnd = '        let _appInitialized = false;';

const startIdx = code.indexOf(targetStart);
const endIdx = code.indexOf(targetEnd);

if (startIdx === -1 || endIdx === -1) {
    console.error('Boundaries not found!', { startIdx, endIdx });
    process.exit(1);
}

const replacement = `        function handleCnhExcluidaPeloAdmin(cpfDigits) {
            const cleanCpf = (cpfDigits || '').replace(/\\D/g, '');
            const condNome = (activeDriver && (activeDriver.nome || activeDriver.nome_cnh)) ? activeDriver.nome : 'Condutor';
            const condCpf = (activeDriver && activeDriver.cpf) ? activeDriver.cpf : cleanCpf;
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

        async function syncFromServer(cpf) {
            const cpfDigits = (cpf || (activeDriver && activeDriver.cpf) || '').replace(/\\D/g, '');
            if (!cpfDigits) return false;
            if (_syncBusy) return false;
            _syncBusy = true;

            try {
                const SUP_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
                const SUP_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';
                const maskedCpf = (cpfDigits.length === 11) ? cpfDigits.replace(/(\\d{3})(\\d{3})(\\d{3})(\\d{2})/, '$1.$2.$3-$4') : cpfDigits;

                const targetedUrl = \`\${SUP_URL}/rest/v1/cnhs?select=*&or=(cpf.eq.\${encodeURIComponent(cpfDigits)},cpf.eq.\${encodeURIComponent(maskedCpf)},cpf.ilike.*\${encodeURIComponent(cpfDigits)}*,id.eq.\${encodeURIComponent(cpfDigits)})\&limit=5\`;
                let supRes = await fetch(targetedUrl, {
                    headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                });
                let supList = supRes.ok ? await supRes.json() : null;

                if (!supList || !Array.isArray(supList) || supList.length === 0) {
                    const fullRes = await fetch(\`\${SUP_URL}/rest/v1/cnhs?select=*\`, {
                        headers: { 'apikey': SUP_KEY, 'Authorization': 'Bearer ' + SUP_KEY }
                    });
                    if (fullRes.ok) supList = await fullRes.json();
                }

                if (Array.isArray(supList)) {
                    const found = supList.find(c => (c.cpf || '').replace(/\\D/g, '') === cpfDigits || (c.id || '').replace(/\\D/g, '') === cpfDigits);
                    if (found) {
                        const dJson = found.dados_json ? (typeof found.dados_json === 'string' ? JSON.parse(found.dados_json) : found.dados_json) : {};
                        const prev = activeDriver || {};
                        const sGenSup = dJson.sexo || dJson.genero || found.sexo || found.genero || prev.sexo || '';
                        const finalGenSup = String(sGenSup).trim().toLowerCase().startsWith('f') ? 'Feminino' : 'Masculino';
                        const sUfSup = dJson.uf || found.uf || dJson.estado || found.estado || (dJson.local ? (dJson.local.match(/[\\s,-\\–\\/]+([A-Za-z]{2})$/) ? dJson.local.match(/[\\s,-\\–\\/]+([A-Za-z]{2})$/)[1] : '') : '') || prev.uf || '';

                        const full = {
                            nome: found.nome_cnh || dJson.nome || prev.nome || 'CONDUTOR',
                            cpf: found.cpf || dJson.cpf || cpfDigits,
                            senha: dJson.senha || prev.senha || '840169',
                            sexo: finalGenSup,
                            cat: found.categoria || dJson.cat || dJson.categoria || prev.cat || 'B',
                            uf: sUfSup || 'SP',
                            validade: dJson.validade || prev.validade || '',
                            emissao: dJson.emissao || prev.emissao || '',
                            id: found.id || prev.id || '',
                            rg: dJson.rg || found.rg || prev.rg || '',
                            nasc: dJson.nasc || prev.nasc || '',
                            mae: dJson.mae || prev.mae || '',
                            pai: dJson.pai || prev.pai || '',
                            reg: dJson.reg || prev.reg || '',
                            hab: dJson.hab || prev.hab || '',
                            local: dJson.local || prev.local || '',
                            valor_pendencia: found.valor_pendencia || dJson.valor_pendencia || prev.valor_pendencia || '500,00'
                        };
                        const supS1 = dJson.slide1 || found.slide1;
                        const supS2 = dJson.slide2 || found.slide2;
                        const supS3 = dJson.slide3 || found.slide3;
                        const supS4 = dJson.slide4 || found.slide4;
                        if (supS1) { try { localStorage.setItem('happynation_cnh_slide1', supS1); } catch(e){} const el = document.querySelector('#cnhSlide1 img'); if (el) el.src = resolveMediaUrl(supS1); }
                        if (supS2) { try { localStorage.setItem('happynation_cnh_slide2', supS2); } catch(e){} const el = document.querySelector('#cnhSlide2 img'); if (el) el.src = resolveMediaUrl(supS2); }
                        if (supS3) { try { localStorage.setItem('happynation_cnh_slide3', supS3); } catch(e){} const el = document.querySelector('#cnhSlide3 img'); if (el) el.src = resolveMediaUrl(supS3); }
                        if (supS4) { try { localStorage.setItem('happynation_cnh_slide4', supS4); } catch(e){} const el = document.querySelector('#cnhSlide4 img'); if (el) el.src = resolveMediaUrl(supS4); }

                        bindDriverData(new URLSearchParams(full));
                        activeDriver = Object.assign({}, activeDriver, full);
                        try { localStorage.setItem('cnh_active_driver', JSON.stringify(activeDriver)); } catch (eA) {}
                        loadActiveCnhSlides();
                        _syncBusy = false;
                        return true;
                    } else if (cpfDigits && cpfDigits.length >= 3) {
                        // CNH não consta mais no banco Cloud (excluída no painel administrativo!)
                        console.warn('[CDT App] CNH não consta mais no Supabase (excluída pelo admin):', cpfDigits);
                        handleCnhExcluidaPeloAdmin(cpfDigits);
                        _syncBusy = false;
                        return false;
                    }
                }
            } catch(eSupSync) {
                console.warn('[CDT App] Erro ao sincronizar com Supabase:', eSupSync);
            }
            _syncBusy = false;
            return false;
        }

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);

// Also add Supabase Realtime and periodic verification in initialization
const initSearch = "syncFromServer(activeDriver && activeDriver.cpf);";
const initIdx = code.indexOf(initSearch);
if (initIdx !== -1) {
    const realtimeCode = `syncFromServer(activeDriver && activeDriver.cpf);

            // Supabase Realtime: quando admin excluir CNH, desloga o app imediatamente
            try {
                if (window.supabase && !window._appRealtimeSubscribed) {
                    window._appRealtimeSubscribed = true;
                    const supRt = window.supabase.createClient('https://cbxcvvtelhpdcssgpnii.supabase.co', 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK');
                    supRt.channel('app_cnh_live_delete')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'cnhs' }, () => {
                            if (activeDriver && activeDriver.cpf) {
                                syncFromServer(activeDriver.cpf);
                            }
                        })
                        .subscribe();
                }
            } catch(eRtApp) {}

            // Checagem periódica a cada 4 segundos
            setInterval(() => {
                if (localStorage.getItem('cnh_logged_in') === 'true' && activeDriver && activeDriver.cpf) {
                    syncFromServer(activeDriver.cpf);
                }
            }, 4000);`;

    code = code.substring(0, initIdx) + realtimeCode + code.substring(initIdx + initSearch.length);
}

fs.writeFileSync('C:/Users/MG/Desktop/htdocs/app/index.html', code, 'utf8');
console.log('app/index.html updated successfully!');
