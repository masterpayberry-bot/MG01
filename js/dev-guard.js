/**
 * MG Editáveis - Dev Guard
 * Proteção de rota para documentos em desenvolvimento.
 * Permite acesso total e irrestrito ao Administrador/Dono do painel para testes e acompanhamento.
 * Clientes regulares são redirecionados com segurança para o catálogo.
 */
(function() {
    'use strict';
    function isDevAdmin() {
        try {
            if (localStorage.getItem('happynation_admin_auth') === 'true' || sessionStorage.getItem('happynation_admin_auth') === 'true') {
                return true;
            }
            var uStr = localStorage.getItem('happynation_user') || sessionStorage.getItem('happynation_user');
            if (uStr) {
                var u = JSON.parse(uStr);
                if (u && (u.role === 'admin' || u.isAdmin === true || (u.email && u.email.toLowerCase().includes('admin')))) {
                    return true;
                }
            }
            var p = new URLSearchParams(window.location.search);
            if (p.get('admin') === '1' || p.get('adm') === '1' || p.get('dev') === '1') {
                return true;
            }
        } catch(e) {}
        return false;
    }

    if (!isDevAdmin()) {
        try {
            sessionStorage.setItem('happynation_toast_dev', 'Acesso Restrito: Este documento está em fase de homologação e liberado apenas para o Administrador/Dono no momento.');
        } catch(e) {}
        window.location.replace('editaveis.html?dev_blocked=1');
    }
})();
