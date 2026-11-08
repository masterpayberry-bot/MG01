/**
 * db-sync.js — MG Editáveis
 * Versão Estática para Vercel / Supabase
 * Remove chamadas para rotas legadas /api/db/* e mantém compatibilidade com localStorage.
 */

(function () {
  'use strict';

  // Chaves gerenciadas no localStorage
  const MANAGED_KEYS = [
    'happynation_admin_users',
    'happynation_registered_users',
    'happynation_admin_cnhs',
    'happynation_admin_recargas',
    'happynation_tickets',
    'happynation_admin_activities',
    'happynation_roadmap'
  ];

  // Métodos seguros sem chamadas de rede para APIs locais inexistentes na Vercel
  function pushLocal(key) {
    // Sincronização é puramente tratada pelo Supabase agora
    return Promise.resolve(true);
  }

  function pullLocal(key) {
    return Promise.resolve(null);
  }

  function syncAll() {
    return Promise.resolve(true);
  }

  // API pública compatível para não quebrar chamadas legadas
  window.MGSync = {
    push: pushLocal,
    pull: pullLocal,
    sync: syncAll,
    api: {
      get: () => Promise.resolve(null),
      post: () => Promise.resolve({ status: 'ok' }),
      delete: () => Promise.resolve({ status: 'ok' }),
      clear: () => Promise.resolve({ status: 'ok' })
    }
  };

  console.log('[MG Editáveis] db-sync.js adaptado para Vercel (requisições /api/db/* desativadas).');
})();
