// ============================================================
// MG EDITÁVEIS - CONEXÃO & SERVIÇOS SUPABASE JAVASCRIPT
// Configuração 100% Estática para Vercel (Sem dependência de PHP/XAMPP)
// ============================================================

(function () {
    'use strict';

    const SUPABASE_PROJECT_URL = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
    const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';

    let _instance = null;

    // Helper interno para obter a instância ativa com segurança
    function getClient() {
        if (!_instance && window.supabase && typeof window.supabase.createClient === 'function') {
            _instance = window.supabase.createClient(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY);
        }
        return _instance;
    }

    // Inicializa imediatamente se o SDK já estiver disponível
    getClient();

    // Getters dinâmicos para window.supabaseInstance e window.supabaseClient
    try {
        Object.defineProperty(window, 'supabaseInstance', {
            get() { return getClient(); },
            set(val) { _instance = val; },
            configurable: true
        });
        Object.defineProperty(window, 'supabaseClient', {
            get() { return getClient(); },
            set(val) { _instance = val; },
            configurable: true
        });
    } catch(e) {
        window.supabaseInstance = getClient();
        window.supabaseClient = window.supabaseInstance;
    }

    // ============================================================
    // SERVIÇOS DE BANCO DE DADOS (USUÁRIOS, CNH, ATESTADOS, EXAMES, RECARGAS)
    // ============================================================
    window.MGSupabase = {
        get client() {
            return getClient();
        },

        // ─── 1. AUTENTICAÇÃO E USUÁRIOS ───────────────────────────
        async login(email, senha) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');

            const cleanEmail = (email || '').trim().toLowerCase();
            const { data, error } = await client
                .from('usuarios')
                .select('*')
                .ilike('email', cleanEmail)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) {
                return { success: false, message: 'Usuário não cadastrado no banco de dados.' };
            }

            const user = data[0];
            if (user.senha !== senha) {
                return { success: false, message: 'Senha incorreta.' };
            }

            if (user.status === 'blocked') {
                return { success: false, blocked: true, message: 'Sua conta está bloqueada pelo Administrador.' };
            }

            if (user.status === 'pending') {
                return {
                    success: false,
                    pending: true,
                    user: user,
                    message: 'Cadastro em análise! Seu acesso ainda não foi liberado pelo Administrador.'
                };
            }

            return { success: true, user: user };
        },

        async register({ nome, email, senha, phone }) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');

            const cleanEmail = (email || '').trim().toLowerCase();

            // Verifica duplicidade de e-mail
            const { data: existing, error: checkErr } = await client
                .from('usuarios')
                .select('id')
                .ilike('email', cleanEmail)
                .limit(1);

            if (checkErr) throw checkErr;
            if (existing && existing.length > 0) {
                return { success: false, message: 'Este e-mail já está cadastrado no sistema.' };
            }

            // Insere novo usuário com saldo zero e status pendente
            const { data, error } = await client
                .from('usuarios')
                .insert([{
                    nome: (nome || '').trim(),
                    email: cleanEmail,
                    senha: senha,
                    phone: phone ? phone.trim() : null,
                    saldo: 0.00,
                    role: 'client',
                    status: 'pending',
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return { success: true, user: data[0] };
        },

        async getUser(userId) {
            const client = getClient();
            if (!client) return null;
            const { data, error } = await client
                .from('usuarios')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) return null;
            return data;
        },

        async updateBalance(userId, newBalance) {
            const client = getClient();
            if (!client) return false;
            const { error } = await client
                .from('usuarios')
                .update({ saldo: parseFloat(newBalance) })
                .eq('id', userId);
            return !error;
        },

        async deductBalance(userId, amount) {
            const client = getClient();
            if (!client) return false;
            const user = await this.getUser(userId);
            if (!user) return false;
            const currentSaldo = parseFloat(user.saldo || 0);
            const novoSaldo = Math.max(0, currentSaldo - parseFloat(amount));
            return await this.updateBalance(userId, novoSaldo);
        },

        // ─── 2. ATESTADOS MÉDICOS ───────────────────────────────────
        async saveAtestado(atestadoData) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');
            const { data, error } = await client
                .from('atestados')
                .insert([{
                    id: atestadoData.id,
                    user_id: atestadoData.user_id,
                    user_nome: atestadoData.user_nome,
                    paciente_nome: atestadoData.paciente_nome,
                    cpf: atestadoData.cpf || null,
                    cns: atestadoData.cns || null,
                    medico_nome: atestadoData.medico_nome || null,
                    crm: atestadoData.crm || null,
                    cid: atestadoData.cid || null,
                    dias_repouso: atestadoData.dias_repouso || 7,
                    unidade_saude: atestadoData.unidade_saude || 'UPA 24h',
                    valor_cobrado: atestadoData.valor_cobrado || 20.00,
                    dados_json: atestadoData.dados_json || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        },

        async listAtestadosByUser(userId) {
            const client = getClient();
            if (!client) return [];
            const { data, error } = await client
                .from('atestados')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) return [];
            return data;
        },

        // ─── 3. CNHS GERADAS ────────────────────────────────────────
        async saveCnh(cnhData) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');
            const { data, error } = await client
                .from('cnhs')
                .insert([{
                    id: cnhData.id,
                    user_id: cnhData.user_id,
                    user_nome: cnhData.user_nome,
                    nome_cnh: cnhData.nome_cnh,
                    cpf: cnhData.cpf,
                    rg: cnhData.rg || null,
                    categoria: cnhData.categoria || 'B',
                    genero: cnhData.genero || 'Feminino',
                    valor_cobrado: cnhData.valor_cobrado || 26.00,
                    valor_pendencia: cnhData.valor_pendencia || '500,00',
                    dados_json: cnhData.dados_json || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        },

        async listCnhsByUser(userId) {
            const client = getClient();
            if (!client) return [];
            const { data, error } = await client
                .from('cnhs')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) return [];
            return data;
        },

        async deleteCnh(id) {
            const client = getClient();
            if (!client) return false;
            const { error } = await client.from('cnhs').delete().eq('id', id);
            return !error;
        },

        // ─── 4. EXAMES TOXICOLÓGICOS ───────────────────────────────
        async saveExame(exameData) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');
            const { data, error } = await client
                .from('exames')
                .insert([{
                    id: exameData.id,
                    user_id: exameData.user_id,
                    user_nome: exameData.user_nome,
                    paciente_nome: exameData.paciente_nome,
                    cpf: exameData.cpf,
                    resultado: exameData.resultado || 'Negativo',
                    laboratorio: exameData.laboratorio || 'LABORATÓRIO CENTRAL',
                    data_coleta: exameData.data_coleta || null,
                    data_laudo: exameData.data_laudo || null,
                    valor_cobrado: exameData.valor_cobrado || 20.00,
                    dados_json: exameData.dados_json || null,
                    created_at: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        },

        async listExamesByUser(userId) {
            const client = getClient();
            if (!client) return [];
            const { data, error } = await client
                .from('exames')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });
            if (error) return [];
            return data;
        },

        // ─── 5. RECARGAS PIX ───────────────────────────────────────
        async solicitarRecarga({ id, userId, userNome, valor, comprovante }) {
            const client = getClient();
            if (!client) throw new Error('Cliente Supabase não inicializado.');
            const { data, error } = await client
                .from('recargas')
                .insert([{
                    id: id || ('REC-' + Date.now()),
                    user_id: userId,
                    user_nome: userNome,
                    valor: parseFloat(valor),
                    metodo: 'PIX QrCode',
                    status: 'pending',
                    comprovante: comprovante || null,
                    data: new Date().toISOString()
                }])
                .select();

            if (error) throw error;
            return data[0];
        },

        async listRecargasByUser(userId) {
            const client = getClient();
            if (!client) return [];
            const { data, error } = await client
                .from('recargas')
                .select('*')
                .eq('user_id', userId)
                .order('data', { ascending: false });
            if (error) return [];
            return data;
        },

                // ─── 5b. INDICAÇÕES & AFILIADOS (INDICA E GANHA) ────────────
        async createIndicacao(payload) {
            const client = getClient();
            if (!client) return null;
            try {
                const { data, error } = await client
                    .from('indicacoes')
                    .insert([payload])
                    .select();
                if (error) {
                    console.warn('[Supabase] Erro ao criar indicação:', error);
                    return null;
                }
                return data && data[0] ? data[0] : null;
            } catch(e) {
                return null;
            }
        },

        async listIndicacoes() {
            const client = getClient();
            if (!client) {
                try {
                    const r = await fetch('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/indicacoes?select=*&order=created_at.desc', {
                        headers: {
                            'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK'
                        }
                    });
                    const d = await r.json();
                    if (Array.isArray(d)) return d;
                } catch(e) {}
                return [];
            }
            try {
                const { data, error } = await client
                    .from('indicacoes')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error || !Array.isArray(data)) return [];
                return data;
            } catch(e) {
                return [];
            }
        },

        async listIndicacoesByIndicador(indicadorId, email) {
            const client = getClient();
            if (!client) {
                try {
                    let url = 'https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/indicacoes?select=*';
                    if (indicadorId && email) {
                        url += '&or=(indicador_id.eq.' + encodeURIComponent(indicadorId) + ',indicador_email.eq.' + encodeURIComponent(email.toLowerCase()) + ')';
                    } else if (indicadorId) {
                        url += '&indicador_id=eq.' + encodeURIComponent(indicadorId);
                    } else if (email) {
                        url += '&indicador_email=eq.' + encodeURIComponent(email.toLowerCase());
                    }
                    url += '&order=created_at.desc';
                    const r = await fetch(url, {
                        headers: {
                            'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK'
                        }
                    });
                    const d = await r.json();
                    if (Array.isArray(d)) return d;
                } catch(e) {}
                return [];
            }
            try {
                let query = client.from('indicacoes').select('*');
                if (indicadorId && email) {
                    query = query.or('indicador_id.eq.' + indicadorId + ',indicador_email.eq.' + email.toLowerCase());
                } else if (indicadorId) {
                    query = query.eq('indicador_id', indicadorId);
                } else if (email) {
                    query = query.eq('indicador_email', email.toLowerCase());
                }
                const { data, error } = await query.order('created_at', { ascending: false });
                if (error || !Array.isArray(data)) return [];
                return data;
            } catch(e) {
                return [];
            }
        },

        async updateIndicacao(id, updateFields) {
            const client = getClient();
            if (!client) {
                try {
                    const r = await fetch('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/indicacoes?id=eq.' + encodeURIComponent(id), {
                        method: 'PATCH',
                        headers: {
                            'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(updateFields)
                    });
                    return r.ok;
                } catch(e) { return false; }
            }
            try {
                const { error } = await client
                    .from('indicacoes')
                    .update(updateFields)
                    .eq('id', id);
                return !error;
            } catch(e) {
                return false;
            }
        },

        // ─── 6. CONFIGURAÇÕES GLOBAIS ─────────────────────────────
        async getConfig(chave) {
            const client = getClient();
            if (!client) return null;
            const { data, error } = await client
                .from('configuracoes')
                .select('valor')
                .eq('chave', chave)
                .single();
            if (error || !data) return null;
            return data.valor;
        },

        async getAllConfigs() {
            const client = getClient();
            if (!client) {
                try {
                    const r = await fetch('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/configuracoes?select=*', {
                        headers: {
                            'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK'
                        }
                    });
                    const d = await r.json();
                    if (Array.isArray(d)) {
                        const map = {};
                        d.forEach(item => { if (item.chave) map[item.chave] = item.valor; });
                        return map;
                    }
                } catch(e) {}
                return {};
            }
            try {
                const { data, error } = await client.from('configuracoes').select('*');
                if (error || !data) return {};
                const map = {};
                data.forEach(item => { map[item.chave] = item.valor; });
                return map;
            } catch(e) {
                return {};
            }
        },

        async saveConfig(chave, valor) {
            const client = getClient();
            const valStr = String(valor);
            let ok = false;

            if (client) {
                try {
                    const { error } = await client
                        .from('configuracoes')
                        .upsert({ chave: chave, valor: valStr }, { onConflict: 'chave' });
                    if (!error) ok = true;
                } catch(e) {}
            }

            if (!ok) {
                try {
                    const res = await fetch('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/configuracoes', {
                        method: 'POST',
                        headers: {
                            'apikey': 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Authorization': 'Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK',
                            'Content-Type': 'application/json',
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        body: JSON.stringify({ chave: chave, valor: valStr })
                    });
                    if (res.ok) ok = true;
                } catch(e) {}
            }

            return ok;
        },

        async syncPricesToLocal() {
            try {
                const configs = await this.getAllConfigs();
                if (configs && Object.keys(configs).length > 0) {
                    if (configs.cnh_price) localStorage.setItem('happynation_cnh_price', configs.cnh_price);
                    if (configs.exame_price) localStorage.setItem('happynation_exame_price', configs.exame_price);
                    if (configs.atestado_price) localStorage.setItem('happynation_atestado_price', configs.atestado_price);
                    if (configs.prontuario_price) localStorage.setItem('happynation_prontuario_price', configs.prontuario_price);
                    if (configs.crlv_price) localStorage.setItem('happynation_crlv_price', configs.crlv_price);
                    if (configs.min_recharge) localStorage.setItem('happynation_min_recharge', configs.min_recharge);
                    if (configs.rg_price) localStorage.setItem('happynation_rg_price', configs.rg_price);
                    if (configs.pix_key) localStorage.setItem('happynation_pix_key', configs.pix_key);
                    if (configs.whatsapp) localStorage.setItem('happynation_whatsapp', configs.whatsapp);
                    if (configs.webapp_customization) {
                        try {
                            const curLocal = JSON.parse(localStorage.getItem('happynation_webapp_customization') || '{}');
                            const incoming = typeof configs.webapp_customization === 'string' ? JSON.parse(configs.webapp_customization) : configs.webapp_customization;
                            if (incoming && typeof incoming === 'object') {
                                ['heroBanner', 'logoImage', 'govHeaderLogo', 'footerSerproImg', 'footerCnhImg', 'footerMinisterioImg'].forEach(f => {
                                    if (!incoming[f] && curLocal[f]) incoming[f] = curLocal[f];
                                });
                                localStorage.setItem('happynation_webapp_customization', JSON.stringify(incoming));
                            }
                        } catch(eCustom) {
                            localStorage.setItem('happynation_webapp_customization', configs.webapp_customization);
                        }
                    }

                    try { window.dispatchEvent(new CustomEvent('mg_prices_synced', { detail: configs })); } catch(e) {}
                    return configs;
                }
            } catch(e) {}
            return null;
        }
    };

    // Sincroniza automaticamente configurações do Supabase na inicialização da página
    try {
        if (typeof window !== 'undefined') {
            setTimeout(function() {
                if (window.MGSupabase && typeof window.MGSupabase.syncPricesToLocal === 'function') {
                    window.MGSupabase.syncPricesToLocal();
                }
            }, 60);
        }
    } catch(e) {}
})();
