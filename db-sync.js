/**
 * db-sync.js — MG Editáveis
 * Sincronização bidirecional entre localStorage e /api/db/*
 * Inclua este script em qualquer página com:
 *   <script src="/db-sync.js"></script>
 */

(function () {
  'use strict';

  // ─── Adaptador Automático de Subpasta XAMPP (ex: /mgeditaveis/ ou root /) ────
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  let subfolder = '';
  if (segments.length > 0) {
    const first = segments[0].toLowerCase();
    const knownFiles = [
      'api', 'app', 'assets', 'index.html', 'index.php', 'login.html',
      'admin.html', 'criar-cnh.html', 'cnh.html', 'habilitacao.html',
      'perfil.html', 'recargas.html', 'suporte.html', 'validar-cnh.html',
      'ver-cnh.html', 'cnh-editor.html', 'indicacoes.html'
    ];
    if (!knownFiles.includes(first)) {
      subfolder = '/' + segments[0];
      const origFetch = window.fetch;
      window.fetch = function(url, init) {
        if (typeof url === 'string' && url.startsWith('/api/')) {
          url = subfolder + url;
        }
        return origFetch.call(this, url, init);
      };
    }
  }

  const API = subfolder + '/api/db';

  // ─── Mapa: chave localStorage → coleção no servidor ────────────────────────
  const KEY_MAP = {
    'happynation_admin_users':      'users',
    'happynation_registered_users': 'users',
    'happynation_admin_cnhs':       'cnhs',
    'happynation_admin_recargas':   'recargas',
    'happynation_tickets':          'tickets',
    'happynation_admin_activities': 'activities',
    'happynation_roadmap':          'roadmap',
  };

  // ─── IMPORTANTE: _origSetItem declarado ANTES de qualquer função que o usa ──
  const _origSetItem = localStorage.setItem.bind(localStorage);

  // ─── Utilitário de requisição ───────────────────────────────────────────────
  function apiPost(colecao, data) {
    return fetch(`${API}/${colecao}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }

  function apiGet(colecao) {
    return fetch(`${API}/${colecao}`)
      .then(r => r.json())
      .then(d => (d && d.status === 'ok' ? d.data : null))
      .catch(() => null);
  }

  // ─── Helpers: listas de exclusão permanente ─────────────────────────────────
  function getDeletedIds() {
    try {
      const list = JSON.parse(localStorage.getItem('happynation_deleted_cnhs') || '[]');
      return Array.isArray(list) ? list.map(String) : [];
    } catch(e) { return []; }
  }

  function getCanceledCpfs() {
    try {
      const list = JSON.parse(localStorage.getItem('happynation_canceled_cpfs') || '[]');
      return Array.isArray(list) ? list.map(c => String(c).replace(/\D/g, '')) : [];
    } catch(e) { return []; }
  }

  function getDeletedRoadmap() {
    try {
      const list = JSON.parse(localStorage.getItem('happynation_deleted_roadmap') || '[]');
      return Array.isArray(list) ? list.map(String) : [];
    } catch(e) { return []; }
  }

  // ─── Sincroniza uma chave local para o servidor ─────────────────────────────
  function pushToServer(key) {
    const colecao = KEY_MAP[key];
    if (!colecao) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      let data = JSON.parse(raw);
      if (Array.isArray(data)) {
        if (colecao === 'roadmap') {
          // Para roadmap, envia a lista completa e ordenada para substituição total
          fetch(`${API}/roadmap/set`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          }).catch(() => {});
          return;
        }

        // Se for CNHs, remove estritamente qualquer CNH deletada ou com CPF cancelado
        if (colecao === 'cnhs') {
          const deletedIds = getDeletedIds();
          const canceledCpfs = getCanceledCpfs();
          data = data.filter(c => {
            if (c.id && deletedIds.includes(String(c.id))) return false;
            const cCpf = (c.cpf || '').replace(/\D/g, '');
            if (cCpf && canceledCpfs.includes(cCpf)) return false;
            return true;
          });
        }
        if (data.length > 0) {
          apiPost(colecao, data);
        }
      }
    } catch(e) {}
  }

  // ─── Puxa dados do servidor e atualiza localStorage ────────────────────────
  async function pullFromServer(key) {
    const colecao = KEY_MAP[key];
    if (!colecao) return;
    const serverData = await apiGet(colecao);
    if (!serverData || !Array.isArray(serverData)) return;

    try {
      if (colecao === 'roadmap') {
        const deletedRoadmap = getDeletedRoadmap();
        let local = [];
        try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

        if (Array.isArray(serverData) && serverData.length > 0) {
          const seen = new Set();
          const clean = [];
          serverData.forEach(item => {
            if (!item || !item.id) return;
            const idStr = String(item.id);
            if (deletedRoadmap.includes(idStr) || seen.has(idStr)) return;
            seen.add(idStr);
            clean.push(item);
          });
          _origSetItem(key, JSON.stringify(clean));
        } else if (Array.isArray(local) && local.length > 0) {
          pushToServer(key);
        }
        return;
      }

      const deletedIds = getDeletedIds();
      const canceledCpfs = getCanceledCpfs();

      // Filtra itens já excluídos/cancelados vindos do servidor
      const cleanServerData = serverData.filter(item => {
        if (item.id && deletedIds.includes(String(item.id))) return false;
        if (colecao === 'cnhs') {
          const cCpf = (item.cpf || '').replace(/\D/g, '');
          if (cCpf && canceledCpfs.includes(cCpf)) return false;
        }
        return true;
      });

      if (colecao === 'cnhs') {
        // Para CNHs: merge inteligente - servidor NUNCA ressuscita excluídos locais
        let local = [];
        try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

        // Filtra locais excluídos também
        const cleanLocal = local.filter(item => {
          if (item.id && deletedIds.includes(String(item.id))) return false;
          const cCpf = (item.cpf || '').replace(/\D/g, '');
          if (cCpf && canceledCpfs.includes(cCpf)) return false;
          return true;
        });

        // Merge: local tem prioridade (preserva foto/assinatura), servidor adiciona apenas novos
        const map = new Map();
        cleanLocal.forEach(item => { if (item.id) map.set(String(item.id), item); });
        cleanServerData.forEach(item => {
          if (item.id && !map.has(String(item.id))) {
            map.set(String(item.id), item);
          }
        });

        const merged = Array.from(map.values());
        _origSetItem(key, JSON.stringify(merged));
        return;
      }

      let local = [];
      try { local = JSON.parse(localStorage.getItem(key) || '[]'); } catch(e) {}

      // Merge: preferência ao servidor para dados de usuários/recargas
      const map = new Map();
      cleanServerData.forEach(item => { if (item.id) map.set(String(item.id), item); });
      local.forEach(item => {
        const k = item.id ? String(item.id) : (item.email || null);
        if (k && !map.has(k) && !deletedIds.includes(String(item.id))) {
          map.set(k, item);
        }
      });

      const merged = Array.from(map.values());
      _origSetItem(key, JSON.stringify(merged));
      if (key === 'happynation_admin_users') {
        _origSetItem('happynation_registered_users', JSON.stringify(merged));
      }
    } catch(e) {}
  }

  // ─── Sincronização inicial ao carregar a página ─────────────────────────────
  async function syncOnLoad() {
    const keys = Object.keys(KEY_MAP);
    // Primeiro puxa do servidor (dados mais recentes)
    for (const key of keys) {
      await pullFromServer(key);
    }
    // Depois envia o que tem no localStorage para o servidor
    keys.forEach(key => pushToServer(key));
  }

  // ─── Intercepta escritas no localStorage para auto-sincronizar ─────────────
  localStorage.setItem = function(key, value) {
    _origSetItem(key, value);
    // Debounce: espera 800ms antes de enviar pro servidor
    if (KEY_MAP[key]) {
      clearTimeout(localStorage['_dbsync_timer_' + key]);
      localStorage['_dbsync_timer_' + key] = setTimeout(() => {
        pushToServer(key);
      }, 800);
    }
  };

  // ─── Expõe API pública ──────────────────────────────────────────────────────
  window.MGSync = {
    push: pushToServer,
    pull: pullFromServer,
    sync: syncOnLoad,
    api: {
      get: apiGet,
      post: apiPost,
      delete: (colecao, id) => fetch(`${API}/${colecao}/${id}`, { method: 'DELETE' }).catch(() => {}),
      clear: (colecao) => fetch(`${API}/${colecao}/clear`, { method: 'POST' }).catch(() => {})
    }
  };

  // ─── Inicia sincronização quando a página carrega ───────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncOnLoad);
  } else {
    syncOnLoad();
  }

  console.log('[MG Editáveis] db-sync.js carregado — banco sincronizado com /api/db/*');
})();
