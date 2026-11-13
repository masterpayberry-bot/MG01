/**
 * saldo-sync.js — MG Editáveis
 * Fonte ÚNICA e CENTRAL de verdade para o saldo em todo o sistema.
 * Sincroniza em tempo real com o banco de dados PostgreSQL do Supabase via REST nativo e SDK.
 * Compatível 100% com Vercel (Front-end estático em abas e dispositivos diferentes).
 */
(function () {
  'use strict';

  const SUPABASE_URL      = 'https://cbxcvvtelhpdcssgpnii.supabase.co';
  const SUPABASE_KEY      = 'sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK';
  const USER_KEY          = 'happynation_user';
  const ADMIN_KEY         = 'happynation_admin_users';
  const REG_KEY           = 'happynation_registered_users';
  const CACHE_KEY         = 'happynation_saldo_cache';

  function safeJSON(key, def) {
    try {
      const v = localStorage.getItem(key) || sessionStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch(e) {
      return def;
    }
  }

  // ─── Resolve o saldo atual de forma infalível ───────────────────────────────
  function getSaldoNumber() {
    const user = safeJSON(USER_KEY, {});
    const email = (user.email || '').toLowerCase().trim();
    const adminUsers = safeJSON(ADMIN_KEY, []);

    // 1. Se existe no adminUsers gerenciado nesta máquina
    if (email && Array.isArray(adminUsers)) {
      const match = adminUsers.find(u => u.email && u.email.toLowerCase().trim() === email);
      if (match && match.saldo !== undefined && match.saldo !== null && !isNaN(parseFloat(match.saldo))) {
        return Math.max(0, parseFloat(match.saldo));
      }
    }

    // 2. Se o usuário tem saldo no objeto de sessão
    if (user && user.saldo !== undefined && user.saldo !== null && !isNaN(parseFloat(user.saldo))) {
      return Math.max(0, parseFloat(user.saldo));
    }

    // 3. Fallback no cache local
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached !== null && !isNaN(parseFloat(cached))) {
      return Math.max(0, parseFloat(cached));
    }

    return 0;
  }

  // ─── Formatação em Moeda Brasileira ─────────────────────────────────────────
  function formatMoney(num) {
    return 'R$ ' + (num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatSaldoHeader(num) {
    return 'Saldo R$ ' + (num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Atualiza TODOS os elementos de saldo na tela ────────────────────────────
  function updateDOM(val) {
    const moneyStr = formatMoney(val);
    const headerStr = formatSaldoHeader(val);

    // 1. Elementos de Header (com prefixo "Saldo R$ ...")
    const headerIds = ['userHeaderSaldo', 'headerSaldo'];
    headerIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = headerStr;
    });

    // 2. Elementos de valor puro ("R$ ...")
    const valueIds = ['mainSaldoValor', 'metricSaldo', 'bottomBarSaldo', 'userSaldo', 'saldoDisplay', 'saldo-display', 'dashSaldo', 'saldoValue', 'costUserSaldo', 'statSaldo'];
    valueIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = moneyStr;
    });

    // 3. Spans dentro de .saldo-pill que não têm ID próprio
    document.querySelectorAll('.saldo-pill span').forEach(el => {
      if (!headerIds.includes(el.id) && !valueIds.includes(el.id)) {
        el.textContent = headerStr;
      }
    });

    // 4. Elementos genéricos com atributo data-mg-saldo
    document.querySelectorAll('[data-mg-saldo]').forEach(el => {
      el.textContent = moneyStr;
    });
  }

  // ─── Propaga para todas as chaves do localStorage ──────────────────────────
  function persistAll(num) {
    const val = Math.max(0, parseFloat(num) || 0);

    // 1. Cache
    try { localStorage.setItem(CACHE_KEY, String(val)); } catch(e) {}

    // 2. happynation_user
    const user = safeJSON(USER_KEY, {});
    if (user && typeof user === 'object' && Object.keys(user).length > 0) {
      user.saldo = val;
      try {
        if (sessionStorage.getItem(USER_KEY)) {
          sessionStorage.setItem(USER_KEY, JSON.stringify(user));
        } else {
          localStorage.setItem(USER_KEY, JSON.stringify(user));
        }
      } catch(e) {}
    }

    // 3. happynation_admin_users e happynation_registered_users
    const email = (user && user.email) ? user.email.toLowerCase().trim() : '';
    if (email) {
      [ADMIN_KEY, REG_KEY].forEach(key => {
        const list = safeJSON(key, []);
        let changed = false;
        if (Array.isArray(list)) {
          list.forEach(u => {
            if (u && u.email && u.email.toLowerCase().trim() === email) {
              u.saldo = val;
              changed = true;
            }
          });
          if (changed) {
            try { localStorage.setItem(key, JSON.stringify(list)); } catch(e) {}
          }
        }
      });
    }

    updateDOM(val);

    // Notifica outras abas e scripts
    try { window.dispatchEvent(new CustomEvent('mg_saldo_updated', { detail: { saldo: val } })); } catch(e) {}
  }

  // ─── Sincronização em Tempo Real com o Banco Supabase (REST Nativo + SDK) ───
  let isFetching = false;
  let lastLocalUpdate = 0;

  // Persiste a alteração de saldo diretamente na nuvem (Supabase Cloud)
  async function persistRemote(val) {
    lastLocalUpdate = Date.now();
    try {
      const user = safeJSON(USER_KEY, {});
      if (!user || (!user.id && !user.email)) return;
      if (user.role === 'admin' && String(user.email).toUpperCase() === 'MG' && !user.id) return;

      const cleanEmail = (user.email || '').toLowerCase().trim();
      let patchUrl = '';

      if (user.id) {
        patchUrl = `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${encodeURIComponent(user.id)}`;
      } else if (cleanEmail) {
        patchUrl = `${SUPABASE_URL}/rest/v1/usuarios?email=ilike.${encodeURIComponent(cleanEmail)}`;
      } else {
        return;
      }

      await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ saldo: val })
      });
      console.log('[SaldoSync] Saldo atualizado com sucesso no Supabase:', val);
    } catch(err) {
      console.warn('[SaldoSync] Erro ao persistir saldo remoto no Supabase:', err);
    }
  }

  async function fetchSaldoFromSupabase() {
    if (isFetching) return;
    // Se houve desconto ou atualização local nos últimos 6 segundos, aguarda para não reverter o saldo
    if (Date.now() - lastLocalUpdate < 6000) return;

    try {
      const user = safeJSON(USER_KEY, {});
      if (!user || (!user.id && !user.email)) return;

      // Não busca saldo para admin master padrão sem vínculo específico
      if (user.role === 'admin' && String(user.email).toUpperCase() === 'MG' && !user.id) return;

      isFetching = true;

      const cleanEmail = (user.email || '').toLowerCase().trim();
      let queryUrl = '';

      if (user.id) {
        queryUrl = `${SUPABASE_URL}/rest/v1/usuarios?id=eq.${encodeURIComponent(user.id)}&select=id,saldo,status`;
      } else if (cleanEmail) {
        queryUrl = `${SUPABASE_URL}/rest/v1/usuarios?email=ilike.${encodeURIComponent(cleanEmail)}&select=id,saldo,status`;
      } else {
        isFetching = false;
        return;
      }

      // 1. Requisição REST Direta (Independente de CDN ou SDK)
      const res = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const row = rows[0];
          if (row.saldo !== undefined && row.saldo !== null) {
            const remoteSaldo = parseFloat(row.saldo);
            if (!isNaN(remoteSaldo) && (Date.now() - lastLocalUpdate >= 6000)) {
              persistAll(remoteSaldo);
            }
          }
          // Atualiza status se bloqueado
          if (row.status === 'blocked' && user.status !== 'blocked') {
            user.status = 'blocked';
            localStorage.setItem(USER_KEY, JSON.stringify(user));
            alert('Sua conta foi bloqueada pelo administrador.');
            window.location.href = 'login.html';
          }
        }
      }
    } catch(err) {
      console.warn('[SaldoSync] Erro na requisição ao Supabase:', err);
    } finally {
      isFetching = false;
    }
  }

  // ─── API Global window.MGSaldo ─────────────────────────────────────────────
  window.MGSaldo = {
    get: function () {
      return getSaldoNumber();
    },
    set: function (val) {
      const num = Math.max(0, parseFloat(val) || 0);
      lastLocalUpdate = Date.now();
      persistAll(num);
      persistRemote(num);
      return num;
    },
    update: function (delta) {
      const current = getSaldoNumber();
      const novo = Math.max(0, current + (parseFloat(delta) || 0));
      lastLocalUpdate = Date.now();
      persistAll(novo);
      persistRemote(novo);
      return novo;
    },
    deduct: async function (amount, activityPayload) {
      const val = parseFloat(amount) || 0;
      if (val <= 0) return true;

      const current = getSaldoNumber();
      const novo = Math.max(0, current - val);

      lastLocalUpdate = Date.now();
      persistAll(novo);
      await persistRemote(novo);

      // Registra atividade no histórico do usuário e do Admin
      try {
        const user = safeJSON(USER_KEY, {});
        const uEmail = (user.email || '').toLowerCase().trim();
        const userName = user.nome || 'Cliente';

        if (activityPayload && typeof activityPayload === 'object') {
          const tipo = activityPayload.tipo || 'documento';
          const descricao = activityPayload.descricao || 'Emissão de Documento';
          const subRotulo = activityPayload.subRotulo || '';

          // 1. Histórico do Usuário
          if (uEmail) {
            const actKey = 'happynation_activities_' + uEmail;
            const acts = safeJSON(actKey, []);
            acts.unshift({
              title: (subRotulo ? subRotulo + ' - ' : '') + String(descricao).toUpperCase(),
              time: 'agora',
              created_at: new Date().toISOString(),
              val: '- R$ ' + val.toFixed(2).replace('.', ',')
            });
            if (acts.length > 50) acts.length = 50;
            try { localStorage.setItem(actKey, JSON.stringify(acts)); } catch(e) {}
          }

          // 2. Histórico do Painel Admin
          const adminActs = safeJSON(ADMIN_KEY.replace('_users', '_activities'), []);
          const newAct = {
            id: 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            tipo: tipo,
            descricao: descricao,
            subRotulo: subRotulo,
            usuario: userName,
            valor: '- R$ ' + val.toFixed(2).replace('.', ','),
            status: 'concluido',
            created_at: new Date().toISOString()
          };
          adminActs.unshift(newAct);
          if (adminActs.length > 50) adminActs.length = 50;
          try { localStorage.setItem(ADMIN_KEY.replace('_users', '_activities'), JSON.stringify(adminActs)); } catch(e) {}

          // Notificação em tempo real (BroadcastChannel e Storage)
          if (typeof BroadcastChannel !== 'undefined') {
            try {
              const bc = new BroadcastChannel('happynation_live_sync');
              bc.postMessage({ type: 'activity_created', activity: newAct });
              bc.close();
            } catch(eBc) {}
          }
          try {
            localStorage.setItem('happynation_last_sync_event', JSON.stringify({ type: 'activity_created', activity: newAct, time: Date.now() }));
          } catch(eLs) {}
        }
      } catch(eAct) {
        console.warn('[SaldoSync] Erro ao registrar atividade na dedução:', eAct);
      }

      console.log(`[SaldoSync] Descontado R$ ${val.toFixed(2)}. Novo saldo: R$ ${novo.toFixed(2)}`);
      return novo;
    },
    format: function (val) {
      return formatMoney(val !== undefined ? val : getSaldoNumber());
    },
    sync: function () {
      const s = getSaldoNumber();
      persistAll(s);
      fetchSaldoFromSupabase();
      return s;
    },
    syncRemote: fetchSaldoFromSupabase
  };

  // ─── GERENCIADOR UNIVERSAL DE CPF E AUTOLIMPEZA DE EXEMPLOS ────────────────
  function mascaraCpfGlobal(v) {
    if (!v) return '';
    let s = String(v).replace(/\D/g, '').slice(0, 11);
    if (s.length > 9) return s.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    if (s.length > 6) return s.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    if (s.length > 3) return s.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    return s;
  }

  window.mascaraCpf = function(inp) {
    if (!inp) return;
    inp.value = mascaraCpfGlobal(inp.value);
  };
  window.formatarCpf = mascaraCpfGlobal;

  function isCpfField(el) {
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return false;
    const id = (el.id || '').toLowerCase();
    const name = (el.name || '').toLowerCase();
    const cls = (el.className || '').toLowerCase();
    const pl = (el.placeholder || '').toLowerCase();

    if (id.includes('cpf') || name.includes('cpf') || cls.includes('cpf')) return true;
    if (id === 'inp_cns') return true; // CPF no criar-atestado.html
    if (pl.includes('000.000.000-00') || pl.includes('cpf')) return true;

    const parent = el.closest('.form-group, .form-field, .cnh-form-field, .input-group, tr, div');
    if (parent) {
      const lbl = parent.querySelector('label, th, .label');
      if (lbl && /\bcpf\b/i.test(lbl.textContent)) return true;
    }
    return false;
  }

  function injectAutoClearStyles() {
    if (document.getElementById('mg-autoclear-style')) return;
    const style = document.createElement('style');
    style.id = 'mg-autoclear-style';
    style.textContent = `
      input.is-sample,
      textarea.is-sample,
      .form-input.is-sample,
      .input-box.is-sample,
      .cnh-input-box.is-sample,
      .field.is-sample {
        color: rgba(255, 255, 255, 0.32) !important;
        -webkit-text-fill-color: rgba(255, 255, 255, 0.32) !important;
        font-style: italic !important;
        transition: color 0.15s ease, -webkit-text-fill-color 0.15s ease;
      }
      input.is-sample.is-sample-light,
      textarea.is-sample.is-sample-light {
        color: #94a3b8 !important;
        -webkit-text-fill-color: #94a3b8 !important;
        opacity: 0.65 !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function initAutoClearAndCpf(root = document) {
    injectAutoClearStyles();

    const isEditMode = new URLSearchParams(window.location.search).get('id');

    const inputs = root.querySelectorAll('input[type="text"], input:not([type]), textarea');
    inputs.forEach(inp => {
      // 1. Aplica máscara automática de CPF (000.000.000-00)
      if (isCpfField(inp)) {
        inp.maxLength = 14;
        if (inp.value && !inp.dataset.cpfFormatted) {
          inp.dataset.cpfFormatted = 'true';
          inp.value = mascaraCpfGlobal(inp.value);
        }
        if (!inp._cpfMaskBound) {
          inp._cpfMaskBound = true;
          inp.addEventListener('input', function() {
            inp.value = mascaraCpfGlobal(inp.value);
          });
        }
      }

      // 2. Modelo de exemplo meio invisível que se autolimpa no clique/foco
      if (!isEditMode && inp.value && !inp._autoClearBound) {
        inp._autoClearBound = true;
        inp.dataset.sampleVal = inp.value;
        inp.dataset.isSample = 'true';
        inp.classList.add('is-sample');

        try {
          const bg = window.getComputedStyle(inp).backgroundColor;
          if (bg && bg.startsWith('rgb')) {
            const m = bg.match(/\d+/g);
            if (m && m.length >= 3) {
              const lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]);
              if (lum > 180) inp.classList.add('is-sample-light');
            }
          }
        } catch(e) {}

        const clearSample = function() {
          if (inp.dataset.isSample === 'true') {
            inp.dataset.sampleVal = inp.value;
            inp.value = '';
            inp.classList.remove('is-sample');
            inp.classList.remove('is-sample-light');
            inp.dataset.isSample = 'false';
          }
        };

        inp.addEventListener('focus', clearSample);
        inp.addEventListener('pointerdown', function() {
          if (inp.dataset.isSample === 'true') {
            setTimeout(clearSample, 10);
          }
        });

        inp.addEventListener('input', function() {
          inp.classList.remove('is-sample');
          inp.classList.remove('is-sample-light');
          inp.dataset.isSample = 'false';
          inp.dataset.userEdited = 'true';
          if (isCpfField(inp)) {
            inp.value = mascaraCpfGlobal(inp.value);
          }
        });

        inp.addEventListener('blur', function() {
          if (!inp.value.trim() && inp.dataset.sampleVal && !inp.dataset.userEdited) {
            inp.value = inp.dataset.sampleVal;
            inp.dataset.isSample = 'true';
            inp.classList.add('is-sample');
          }
        });
      }
    });
  }

  window.initAutoClearAndCpf = initAutoClearAndCpf;

  // ─── Inicialização e Ciclo de Vida ─────────────────────────────────────────
  function runSync() {
    const s = getSaldoNumber();
    persistAll(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runSync();
      fetchSaldoFromSupabase();
      initAutoClearAndCpf();
    });
  } else {
    runSync();
    fetchSaldoFromSupabase();
    initAutoClearAndCpf();
  }

  window.addEventListener('load', () => {
    runSync();
    initAutoClearAndCpf();
    setTimeout(fetchSaldoFromSupabase, 300);
    setTimeout(fetchSaldoFromSupabase, 1200);
    // Sincroniza periodicamente a cada 5 segundos com o Supabase
    setInterval(fetchSaldoFromSupabase, 5000);
  });

  // Observa novos inputs inseridos dinamicamente no DOM
  try {
    const observer = new MutationObserver(() => {
      initAutoClearAndCpf();
    });
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
      });
    }
  } catch(eObs) {}

  // Atualiza imediatamente quando a aba volta ao foco
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      runSync();
      fetchSaldoFromSupabase();
    }
  });
  window.addEventListener('focus', () => {
    runSync();
    fetchSaldoFromSupabase();
  });

  // Sincroniza em tempo real se outra aba mudar localStorage
  window.addEventListener('storage', (e) => {
    if ([USER_KEY, ADMIN_KEY, REG_KEY, CACHE_KEY].includes(e.key)) {
      setTimeout(runSync, 50);
    }
  });

  console.log('[MG Editáveis] saldo-sync.js ativo (Sincronização bidirecional Supabase ativada).');
})();
