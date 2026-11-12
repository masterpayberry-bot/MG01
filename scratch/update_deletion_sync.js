const fs = require('fs');

// 1. UPDATE cnh.html
let cnhHtml = fs.readFileSync('cnh.html', 'utf8');

const newDeleteCnhFn = `function deleteCnhRow(cnhId) {
    if (!confirm('Deseja realmente excluir esta CNH permanentemente? O prontuário deste CPF será cancelado no sistema.')) return;

    let cnhs = getCnhs();
    const itemToDelete = cnhs.find(c => c.id === cnhId);
    const cleanCpf = itemToDelete && itemToDelete.cpf ? itemToDelete.cpf.replace(/\\D/g, '') : '';
    const vPendVal = itemToDelete ? (itemToDelete.valor_pendencia || itemToDelete.valor || (itemToDelete.dados && itemToDelete.dados.valor_pendencia) || '500,00') : '500,00';

    cnhs = cnhs.filter(c => c.id !== cnhId);
    saveCnhs(cnhs);

    try {
        // Limpa das listas em localStorage de todos os usuários
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('happynation_cnhs_')) {
                try {
                    const list = JSON.parse(localStorage.getItem(key) || '[]');
                    const filtered = list.filter(c => c.id !== cnhId && (cleanCpf ? (c.cpf || '').replace(/\\D/g, '') !== cleanCpf : true));
                    localStorage.setItem(key, JSON.stringify(filtered));
                } catch(eKey) {}
            }
        }

        localStorage.removeItem('happynation_foto_' + cnhId);
        localStorage.removeItem('happynation_ass_' + cnhId);

        if (cleanCpf) {
            // Registra CPF como cancelado no localStorage
            const canceled = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
            if (!canceled.includes(cleanCpf)) {
                canceled.push(cleanCpf);
                localStorage.setItem('happynation_canceled_cpfs', JSON.stringify(canceled));
            }
            let delIds = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
            if (!delIds.includes(cleanCpf)) delIds.push(cleanCpf);
            if (cnhId && !delIds.includes(String(cnhId))) delIds.push(String(cnhId));
            localStorage.setItem('happynation_deleted_cnhs', JSON.stringify(delIds));

            try {
                localStorage.setItem('happynation_blocked_cnh_' + cleanCpf, JSON.stringify({ valor_pendencia: vPendVal }));
            } catch(eBlk) {}

            // Se a CNH ativa no app for deste CPF, limpa os dados da CNH
            let lastCnh = null;
            try { lastCnh = JSON.parse(localStorage.getItem('happynation_last_cnh') || '{}'); } catch(ex) {}
            if (lastCnh && lastCnh.cpf && lastCnh.cpf.replace(/\\D/g, '') === cleanCpf) {
                localStorage.removeItem('happynation_last_cnh');
                localStorage.removeItem('cnh_active_driver');
                localStorage.removeItem('cnh_logged_in');
                localStorage.removeItem('happynation_cnh_slide1');
                localStorage.removeItem('happynation_cnh_slide2');
                localStorage.removeItem('happynation_cnh_slide3');
                localStorage.removeItem('happynation_cnh_slide4');
                localStorage.removeItem('happynation_cnh_qr_url');
            }
        }

        // Broadcast instantâneo para o aplicativo (fecha na hora caso o cliente esteja com o app aberto)
        try {
            const bc = new BroadcastChannel('happynation_live_sync');
            bc.postMessage({
                type: 'cnh_deleted',
                cpf: cleanCpf,
                id: cnhId,
                valor_pendencia: vPendVal
            });
            bc.close();
        } catch(eBc) {}
    } catch(e) {}

    // Notifica servidor para excluir do banco MySQL e de app/db.json
    fetch('api/index.php?action=delete_cnh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cnhId, cpf: cleanCpf, valor_pendencia: vPendVal })
    }).catch(() => {});
    fetch('api/db/cnhs/' + encodeURIComponent(cnhId), { method: 'DELETE' }).catch(() => {});

    renderTable();
    showToast('CNH excluída permanentemente! Prontuário cancelado.');
}`;

cnhHtml = cnhHtml.replace(/function deleteCnhRow\(cnhId\) \{[\s\S]*?showToast\('CNH excluída permanentemente! Prontuário cancelado\.'\);\s*\}/, newDeleteCnhFn);
fs.writeFileSync('cnh.html', cnhHtml, 'utf8');
console.log('cnh.html updated successfully!');

// 2. UPDATE admin.html
let adminHtml = fs.readFileSync('admin.html', 'utf8');

const newDeleteCnhAdminFn = `function deleteCnhAdmin(cnhId, cpf) {
            if (!confirm('Deseja realmente excluir esta CNH? O prontuário deste CPF será cancelado.')) return;
            const cleanCpf = (cpf || '').replace(/\\D/g, '');
            const targetRec = (cnhsData && Array.isArray(cnhsData)) ? cnhsData.find(x => x.id === cnhId || (cleanCpf && (x.cpf||'').replace(/\\D/g, '') === cleanCpf)) : null;
            const vPendVal = targetRec ? (targetRec.valor_pendencia || targetRec.valor || (targetRec.dados && targetRec.dados.valor_pendencia) || '500,00') : '500,00';

            cnhsData = cnhsData.filter(c => c.id !== cnhId);
            saveStorage();
            renderCnhsTable();

            try {
                let delIds = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
                if (cnhId && !delIds.includes(String(cnhId))) delIds.push(String(cnhId));
                if (cleanCpf && !delIds.includes(cleanCpf)) delIds.push(cleanCpf);
                localStorage.setItem('happynation_deleted_cnhs', JSON.stringify(delIds));

                if (cleanCpf) {
                    const canceled = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
                    if (!canceled.includes(cleanCpf)) {
                        canceled.push(cleanCpf);
                        localStorage.setItem('happynation_canceled_cpfs', JSON.stringify(canceled));
                    }
                    try {
                        localStorage.setItem('happynation_blocked_cnh_' + cleanCpf, JSON.stringify({ valor_pendencia: vPendVal }));
                    } catch(eBlk) {}

                    let lastCnh = null;
                    try { lastCnh = JSON.parse(localStorage.getItem('happynation_last_cnh') || '{}'); } catch(ex) {}
                    if (lastCnh && lastCnh.cpf && lastCnh.cpf.replace(/\\D/g, '') === cleanCpf) {
                        localStorage.removeItem('happynation_last_cnh');
                        localStorage.removeItem('cnh_active_driver');
                        localStorage.removeItem('cnh_logged_in');
                        localStorage.removeItem('happynation_cnh_slide1');
                        localStorage.removeItem('happynation_cnh_slide2');
                        localStorage.removeItem('happynation_cnh_slide3');
                        localStorage.removeItem('happynation_cnh_slide4');
                        localStorage.removeItem('happynation_cnh_qr_url');
                    }
                }

                // Limpa das listas de usuários específicas em localStorage
                for (let i = 0; i < localStorage.length; i++) {
                    const k = localStorage.key(i);
                    if (k && k.startsWith('happynation_cnhs_')) {
                        try {
                            let list = JSON.parse(localStorage.getItem(k) || '[]');
                            if (Array.isArray(list)) {
                                const filtered = list.filter(item => String(item.id) !== String(cnhId) && (cleanCpf ? (item.cpf||'').replace(/\\D/g, '') !== cleanCpf : true));
                                localStorage.setItem(k, JSON.stringify(filtered));
                            }
                        } catch(eK) {}
                    }
                }

                // Broadcast instantâneo para o app
                try {
                    const bc = new BroadcastChannel('happynation_live_sync');
                    bc.postMessage({
                        type: 'cnh_deleted',
                        cpf: cleanCpf,
                        id: cnhId,
                        valor_pendencia: vPendVal
                    });
                    bc.close();
                } catch(eBc) {}
            } catch(e) {}

            // Remove do Supabase Cloud
            fetch('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/cnhs?id=eq.' + encodeURIComponent(cnhId), {
                method: 'DELETE',
                headers: {
                    'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                    'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK'
                }
            }).catch(() => {});

            fetch('api/index.php?action=delete_cnh', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: cnhId, cpf: cleanCpf, valor_pendencia: vPendVal })
            }).catch(() => {});
            fetch('api/db/cnhs/' + encodeURIComponent(cnhId), { method: 'DELETE' }).catch(() => {});

            showToast('CNH excluída com sucesso! Prontuário cancelado.');
        }`;

adminHtml = adminHtml.replace(/function deleteCnhAdmin\(cnhId, cpf\) \{[\s\S]*?showToast\('CNH excluída com sucesso! Prontuário cancelado\.'\);\s*\}/, newDeleteCnhAdminFn);
fs.writeFileSync('admin.html', adminHtml, 'utf8');
console.log('admin.html updated successfully!');

// 3. UPDATE api/index.php
let apiPhp = fs.readFileSync('api/index.php', 'utf8');

// Atualiza case 'delete_cnh' para salvar valor_pendencia em blocked_cpfs
const oldDeletePhp = `        // 3. Registra CPF na lista de cancelados
        if (!empty($cleanCpf)) {
            $cfg = readConfigJson();
            if (!isset($cfg['canceled_cpfs']) || !is_array($cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'] = [];
            }
            if (!in_array($cleanCpf, $cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'][] = $cleanCpf;
            }
            writeConfigJson($cfg);
        }`;

const newDeletePhp = `        // 3. Registra CPF na lista de cancelados e bloqueados
        if (!empty($cleanCpf)) {
            $cfg = readConfigJson();
            if (!isset($cfg['canceled_cpfs']) || !is_array($cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'] = [];
            }
            if (!in_array($cleanCpf, $cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'][] = $cleanCpf;
            }
            $vPendReq = trim($inputData['valor_pendencia'] ?? '500,00');
            if (!isset($cfg['blocked_cpfs']) || !is_array($cfg['blocked_cpfs'])) {
                $cfg['blocked_cpfs'] = [];
            }
            $cfg['blocked_cpfs'][$cleanCpf] = ['valor_pendencia' => $vPendReq];
            writeConfigJson($cfg);
        }`;

if (apiPhp.includes(oldDeletePhp)) {
    apiPhp = apiPhp.replace(oldDeletePhp, newDeletePhp);
    console.log('api/index.php delete_cnh updated!');
} else {
    console.log('oldDeletePhp not matched exactly, checking...');
}

// Atualiza retorno de cancelado em verificar_cpf_cnh
const oldCanceledCheck = `            // Se NÃO encontrou CNH ativa e está na lista de cancelados, aí sim avisa que o prontuário foi cancelado
            $cfg = readConfigJson();
            if (in_array($cleanCpf, $cfg['canceled_cpfs'] ?? [])) {
                jsonResponse('error', ['status' => 'canceled'], 'Prontuário vencido, documentação foi cancelada.');
            }`;

const newCanceledCheck = `            // Se NÃO encontrou CNH ativa e está na lista de cancelados, aí sim avisa que o prontuário foi cancelado
            $cfg = readConfigJson();
            if (in_array($cleanCpf, $cfg['canceled_cpfs'] ?? [])) {
                $vPendRet = $cfg['blocked_cpfs'][$cleanCpf]['valor_pendencia'] ?? '500,00';
                jsonResponse('error', ['status' => 'canceled', 'blocked' => true, 'valor_pendencia' => $vPendRet], 'Prontuário bloqueado por pendência administrativa.');
            }`;

if (apiPhp.includes(oldCanceledCheck)) {
    apiPhp = apiPhp.replace(oldCanceledCheck, newCanceledCheck);
    console.log('api/index.php verificar_cpf_cnh updated!');
} else {
    console.log('oldCanceledCheck not matched exactly, checking...');
}

fs.writeFileSync('api/index.php', apiPhp, 'utf8');
