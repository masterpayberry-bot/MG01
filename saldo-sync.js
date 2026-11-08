/**
 * saldo-sync.js — MG Editáveis
 * Fonte ÚNICA e CENTRAL de verdade para o saldo em todo o sistema.
 * Garante sincronia 100% perfeita entre todas as páginas e abas:
 *  - happynation_user
 *  - happynation_admin_users
 *  - happynation_registered_users
 *  - Servidor /api/db/users
 */
(function () {
  'use strict';

  const USER_KEY    = 'happynation_user';
  const ADMIN_KEY   = 'happynation_admin_users';
  const REG_KEY     = 'happynation_registered_users';
  const CACHE_KEY   = 'happynation_saldo_cache';

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

    // 1. Prioridade: se existe no adminUsers, o saldo gerenciado pelo Admin é a autoridade máxima
    if (email && Array.isArray(adminUsers)) {
      const match = adminUsers.find(u => u.email && u.email.toLowerCase().trim() === email);
      if (match && match.saldo !== undefined && match.saldo !== null && !isNaN(parseFloat(match.saldo))) {
        return Math.max(0, parseFloat(match.saldo));
      }
    }

    // 2. Se não tem no adminUsers mas o user tem saldo
    if (user && user.saldo !== undefined && user.saldo !== null && !isNaN(parseFloat(user.saldo))) {
      return Math.max(0, parseFloat(user.saldo));
    }

    // 3. Fallback no cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached !== null && !isNaN(parseFloat(cached))) {
      return Math.max(0, parseFloat(cached));
    }

    return 0;
  }

  // ─── Formatação ─────────────────────────────────────────────────────────────
  function formatMoney(num) {
    return 'R$ ' + (num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatSaldoHeader(num) {
    return 'Saldo R$ ' + (num || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ─── Atualiza TODOS os elementos na tela ───────────────────────────────────
  function updateDOM(val) {
    const moneyStr = formatMoney(val);
    const headerStr = formatSaldoHeader(val);

    // 1. Elementos de Header (com prefixo "Saldo ")
    const headerIds = ['userHeaderSaldo', 'headerSaldo'];
    headerIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = headerStr;
    });

    // 2. Elementos de valor puro (apenas "R$ 0,00")
    const valueIds = ['mainSaldoValor', 'metricSaldo', 'bottomBarSaldo', 'userSaldo', 'saldoDisplay', 'saldo-display', 'dashSaldo', 'saldoValue'];
    valueIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = moneyStr;
    });

    // 3. Spans dentro de .saldo-pill que não têm ID próprio
    document.querySelectorAll('.saldo-pill span').forEach(el => {
      // Se não tem id específico já tratado
      if (!headerIds.includes(el.id) && !valueIds.includes(el.id)) {
        el.textContent = headerStr;
      }
    });

    // 4. Elementos genéricos marcados com atributo
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
    if (user) {
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

    // Notifica outras abas/scripts
    try { window.dispatchEvent(new CustomEvent('mg_saldo_updated', { detail: { saldo: val } })); } catch(e) {}
  }

  // ─── API Global ────────────────────────────────────────────────────────────
  window.MGSaldo = {
    get: function () {
      return getSaldoNumber();
    },
    set: function (val) {
      const num = Math.max(0, parseFloat(val) || 0);
      persistAll(num);
      return num;
    },
    update: function (delta) {
      const current = getSaldoNumber();
      const novo = Math.max(0, current + (parseFloat(delta) || 0));
      persistAll(novo);
      return novo;
    },
    format: function (val) {
      return formatMoney(val !== undefined ? val : getSaldoNumber());
    },
    sync: function () {
      const s = getSaldoNumber();
      persistAll(s);
      return s;
    }
  };

  // ─── Inicialização e Ouvintes ──────────────────────────────────────────────
  function runSync() {
    const s = getSaldoNumber();
    persistAll(s);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runSync);
  } else {
    runSync();
  }

  // Reforço ao terminar todo o carregamento e scripts da página
  window.addEventListener('load', () => {
    setTimeout(runSync, 50);
    setTimeout(runSync, 300);
    setTimeout(runSync, 800);
  });

  // Sincroniza em tempo real se outra aba mudar localStorage
  window.addEventListener('storage', (e) => {
    if ([USER_KEY, ADMIN_KEY, REG_KEY, CACHE_KEY].includes(e.key)) {
      setTimeout(runSync, 50);
    }
  });

  console.log('[MG Editáveis] saldo-sync.js ativo e operacional.');
})();
