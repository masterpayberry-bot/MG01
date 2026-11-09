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

  // ─── Inicialização e Ciclo de Vida ─────────────────────────────────────────
  function runSync() {
    const s = getSaldoNumber();
    persistAll(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      runSync();
      fetchSaldoFromSupabase();
    });
  } else {
    runSync();
    fetchSaldoFromSupabase();
  }

  window.addEventListener('load', () => {
    runSync();
    setTimeout(fetchSaldoFromSupabase, 300);
    setTimeout(fetchSaldoFromSupabase, 1200);
    // Sincroniza periodicamente a cada 5 segundos com o Supabase
    setInterval(fetchSaldoFromSupabase, 5000);
  });

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
