/**
 * MG Editáveis - Auth Guard & Proteção de Rotas
 * Impede o acesso direto a qualquer área interna sem autenticação prévia.
 * Redireciona imediatamente para login.html caso o usuário não esteja autenticado.
 */
(function() {
    'use strict';
    // MULTI-DOMINIO HOSTMF AUTO-ROUTE
    try {
        var currentHost = window.location.hostname.toLowerCase();
        var rawCfg = localStorage.getItem('happynation_domains_cfg');
        if (rawCfg) {
            var dCfg = JSON.parse(rawCfg);
            if (dCfg) {
                // Se o visitante acessou a raiz usando o domínio de Validação
                if (dCfg.dominioQrCode && dCfg.dominioQrCode.toLowerCase().includes(currentHost)) {
                    if (!window.location.pathname.includes('validar-cnh.html')) {
                        window.location.replace('validar-cnh.html' + window.location.search);
                        return;
                    }
                }
                // Se o visitante acessou a raiz usando o domínio do App CDT
                if (dCfg.dominioApp && dCfg.dominioApp.toLowerCase().includes(currentHost)) {
                    if (!window.location.pathname.includes('/app/')) {
                        window.location.replace('app/index.html' + window.location.search);
                        return;
                    }
                }
            }
        }
    } catch(e) {}


    // Global logout helper acessível em qualquer página interna
    window.handleLogout = function(e) {
        if (e && e.preventDefault) e.preventDefault();
        try {
            localStorage.removeItem('happynation_user');
            sessionStorage.removeItem('happynation_user');
        } catch(err) {}
        var isSubdir = window.location.pathname.includes('/app/');
        window.location.replace((isSubdir ? '../' : '') + 'login.html?logged_out=1');
    };

    try {
        var user = null;
        var rawLocal = localStorage.getItem('happynation_user');
        var rawSession = sessionStorage.getItem('happynation_user');

        if (rawLocal) {
            try { user = JSON.parse(rawLocal); } catch(e) {}
        }
        if (!user && rawSession) {
            try { user = JSON.parse(rawSession); } catch(e) {}
        }

        // Valida se o usuário está devidamente autenticado
        var isValid = Boolean(user && (user.logged === true || user.id) && user.email);

        if (!isValid) {
            // Limpa resíduos de sessões inválidas
            try {
                localStorage.removeItem('happynation_user');
                sessionStorage.removeItem('happynation_user');
            } catch(e) {}

            // Redireciona instantaneamente para login.html
            var isSubdir = window.location.pathname.includes('/app/');
            var target = (isSubdir ? '../' : '') + 'login.html';
            window.location.replace(target);
            return;
        }

        // Delegação de evento para garantir que qualquer clique em "Sair" acione o handleLogout
        document.addEventListener('DOMContentLoaded', function() {
            document.querySelectorAll('a[href*="login.html"], .dropdown-item.danger, [data-logout]').forEach(function(el) {
                var text = (el.textContent || '').toLowerCase();
                if (text.includes('sair') || el.getAttribute('href') === 'login.html') {
                    el.addEventListener('click', function(ev) {
                        ev.preventDefault();
                        window.handleLogout(ev);
                    });
                }
            });
        });
    } catch(err) {
        window.location.replace('login.html');
    }
})();
