/**
 * MG Editáveis - Security Guard
 * Proteção total contra cópia, toque longo (mobile), download de fotos/logos e inspeção de código fonte.
 * ATIVO EXCLUSIVAMENTE PARA CLIENTES E VISITANTES. ADMINISTRADOR É 100% ISENTO.
 */
(function() {
    'use strict';

    // 1. CHECAGEM INICIAL DE ISENÇÃO DO ADMINISTRADOR E DO APP DO MOTORISTA
    function isExemptAdmin() {
        try {
            const path = window.location.pathname.toLowerCase();
            // Qualquer página do aplicativo do motorista (onde o usuário precisa tirar print do documento) ou telas administrativas
            if (path.includes('/app') || path.includes('app/index.html') || path.includes('admin') || path.includes('criar-cnh') || path.includes('cnh-editor') || path.includes('validar-cnh')) {
                return true;
            }

            // Checa usuário logado no storage
            const user = JSON.parse(localStorage.getItem('happynation_user') || sessionStorage.getItem('happynation_user') || '{}');
            if (user && (user.role === 'admin' || user.email === 'moritzpj@gmail.com' || user.email === 'admin@mgeditaveis.com' || user.email === 'admin@happynation.app')) {
                return true;
            }

            if (localStorage.getItem('happynation_admin_auth') || sessionStorage.getItem('happynation_admin_auth') ||
                localStorage.getItem('happynation_is_admin') === 'true' || sessionStorage.getItem('happynation_is_admin') === 'true') {
                return true;
            }
        } catch(e) {}
        return false;
    }

    // Se for o administrador em qualquer tela admin, o Security Guard é 100% desligado
    if (isExemptAdmin()) {
        console.log('[Security Guard] Modo Administrador detectado: proteção desativada.');
        return;
    }

    // 2. INJEÇÃO DE ESTILOS ANTI-CÓPIA, ANTI-DRAG E ANTI-TOUCH-CALLOUT PARA CLIENTES
    const style = document.createElement('style');
    style.id = 'security-guard-styles';
    style.innerHTML = `
        /* Desabilita seleção de texto e menu nativo de toque longo */
        *, *::before, *::after {
            -webkit-touch-callout: none !important;
            -webkit-user-select: none !important;
            -khtml-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
        }

        /* Permite digitação e seleção apenas em campos de formulário legítimos */
        input, textarea, [contenteditable="true"] {
            -webkit-touch-callout: default !important;
            -webkit-user-select: text !important;
            -khtml-user-select: text !important;
            -moz-user-select: text !important;
            -ms-user-select: text !important;
            user-select: text !important;
        }

        /* Impede arrastar ou salvar imagens, logos e fotos */
        img, svg, picture, video, canvas, [role="img"] {
            -webkit-user-drag: none !important;
            -khtml-user-drag: none !important;
            -moz-user-drag: none !important;
            -o-user-drag: none !important;
            user-drag: none !important;
            -webkit-touch-callout: none !important;
            pointer-events: auto;
        }

        /* Modal de Bloqueio de Segurança Fullscreen */
        #mg-security-lockout-modal {
            position: fixed !important;
            inset: 0 !important;
            z-index: 2147483647 !important;
            background: rgba(5, 7, 12, 0.96) !important;
            backdrop-filter: blur(12px) !important;
            -webkit-backdrop-filter: blur(12px) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            color: #ffffff !important;
            animation: mgFadeIn 0.3s ease-out forwards;
        }

        @keyframes mgFadeIn {
            from { opacity: 0; transform: scale(0.98); }
            to { opacity: 1; transform: scale(1); }
        }

        .mg-security-card {
            background: #11141b !important;
            border: 1px solid rgba(239, 68, 68, 0.4) !important;
            border-radius: 20px !important;
            max-width: 460px !important;
            width: 100% !important;
            padding: 32px 24px !important;
            text-align: center !important;
            box-shadow: 0 25px 60px -15px rgba(239, 68, 68, 0.25), 0 0 40px rgba(239, 68, 68, 0.1) !important;
        }

        .mg-security-icon {
            width: 72px !important;
            height: 72px !important;
            margin: 0 auto 20px auto !important;
            background: rgba(239, 68, 68, 0.15) !important;
            border: 2px solid rgba(239, 68, 68, 0.4) !important;
            border-radius: 50% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #ef4444 !important;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.3) !important;
        }

        .mg-security-title {
            font-size: 20px !important;
            font-weight: 800 !important;
            color: #ffffff !important;
            margin-bottom: 12px !important;
            letter-spacing: -0.3px !important;
        }

        .mg-security-text {
            font-size: 14px !important;
            line-height: 1.6 !important;
            color: #94a3b8 !important;
            margin-bottom: 18px !important;
        }

        .mg-security-reason-box {
            background: rgba(239, 68, 68, 0.08) !important;
            border: 1px dashed rgba(239, 68, 68, 0.35) !important;
            border-radius: 10px !important;
            padding: 12px !important;
            font-size: 12.5px !important;
            color: #fca5a5 !important;
            margin-bottom: 24px !important;
            word-break: break-word !important;
        }

        .mg-btn-whatsapp {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 10px !important;
            background: #22c55e !important;
            color: #ffffff !important;
            text-decoration: none !important;
            font-size: 15px !important;
            font-weight: 700 !important;
            padding: 15px 20px !important;
            border-radius: 12px !important;
            box-shadow: 0 8px 20px rgba(34, 197, 94, 0.35) !important;
            transition: all 0.2s ease !important;
            width: 100% !important;
            box-sizing: border-box !important;
        }

        .mg-btn-whatsapp:hover {
            background: #16a34a !important;
            transform: translateY(-2px) !important;
            box-shadow: 0 12px 25px rgba(34, 197, 94, 0.45) !important;
        }

        .mg-btn-admin-unlock {
            margin-top: 16px !important;
            background: none !important;
            border: none !important;
            color: #64748b !important;
            font-size: 12px !important;
            cursor: pointer !important;
            text-decoration: underline !important;
            padding: 6px !important;
        }
        .mg-btn-admin-unlock:hover {
            color: #94a3b8 !important;
        }
    `;

    if (document.head) {
        document.head.appendChild(style);
    } else {
        document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    }

    // 3. BLOQUEIO DE BOTÃO DIREITO DO MOUSE E MENU DE CONTEXTO PARA CLIENTES
    window.addEventListener('contextmenu', function(e) {
        if (isExemptAdmin()) return;
        const target = e.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
            return; // Permite menu básico em campos de digitação
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    }, { capture: true });

    // 4. BLOQUEIO DE ARRASTAR ELEMENTOS E IMAGENS
    window.addEventListener('dragstart', function(e) {
        if (isExemptAdmin()) return;
        e.preventDefault();
        return false;
    }, { capture: true });

    // 5. BLOQUEIO DE TECLAS DE ATALHO DE INSPEÇÃO (F12, CTRL+SHIFT+I, CTRL+U, CTRL+S, ETC)
    window.addEventListener('keydown', function(e) {
        if (isExemptAdmin()) return;

        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const key = e.key ? e.key.toUpperCase() : '';
        const keyCode = e.keyCode || e.which;

        // PRINT / CAPTURA DE TELA É 100% LIBERADA (nunca bloqueia print)
        if (key === 'PRINTSCREEN' || keyCode === 44) {
            return true;
        }

        // F12 (DevTools)
        if (key === 'F12' || keyCode === 123) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de abertura do DevTools (F12)');
            return false;
        }

        // Ctrl+Shift+I / Meta+Alt+I (Inspecionar)
        if (isCtrlOrMeta && (e.shiftKey || e.altKey) && (key === 'I' || keyCode === 73)) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de inspeção de elemento (Ctrl+Shift+I)');
            return false;
        }

        // Ctrl+Shift+J / Meta+Alt+J (Console)
        if (isCtrlOrMeta && (e.shiftKey || e.altKey) && (key === 'J' || keyCode === 74)) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de abertura do console (Ctrl+Shift+J)');
            return false;
        }

        // Ctrl+Shift+C / Meta+Alt+C (Seletor de elementos)
        if (isCtrlOrMeta && (e.shiftKey || e.altKey) && (key === 'C' || keyCode === 67)) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de inspeção de código (Ctrl+Shift+C)');
            return false;
        }

        // Ctrl+U / Meta+U (Ver Código Fonte)
        if (isCtrlOrMeta && (key === 'U' || keyCode === 85)) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de visualização do código-fonte (Ctrl+U)');
            return false;
        }

        // Ctrl+S / Meta+S (Salvar Página)
        if (isCtrlOrMeta && (key === 'S' || keyCode === 83)) {
            e.preventDefault();
            e.stopPropagation();
            triggerSecurityLockout('Tentativa de salvar código do site (Ctrl+S)');
            return false;
        }
    }, { capture: true });

    // 6. PRINTS E CAPTURAS DE TELA SÃO 100% LIBERADOS SEM BLOQUEIO
    let lockoutTriggered = false;

    // 7. FUNÇÃO DE BLOQUEIO TOTAL E REGISTRO DE VIOLAÇÃO
    function triggerSecurityLockout(reason) {
        if (lockoutTriggered || isExemptAdmin()) return;
        lockoutTriggered = true;

        let userEmail = '';
        try {
            const user = JSON.parse(localStorage.getItem('happynation_user') || '{}');
            userEmail = user.email || '';
        } catch(e) {}

        // Envia notificação imediata para a API registrar o IP e banir o acesso do cliente
        const payload = JSON.stringify({
            motivo: reason,
            user_email: userEmail,
            url: window.location.href,
            ua: navigator.userAgent
        });

        const apiUrl = (window.location.pathname.includes('/app/') ? '../api/index.php' : 'api/index.php') + '?action=registrar_violacao_ip';

        if (navigator.sendBeacon) {
            navigator.sendBeacon(apiUrl, payload);
        } else {
            try {
                fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: payload,
                    keepalive: true
                });
            } catch(e) {}
        }

        // Limpa totalmente dados locais e sessão do cliente infrator
        try {
            localStorage.clear();
            sessionStorage.clear();
            sessionStorage.setItem('mg_security_lockout', '1');
            sessionStorage.setItem('mg_security_reason', reason);
        } catch(e) {}

        // Se já está na tela de login, renderiza o modal diretamente; senão redireciona para login.html
        const isLogin = window.location.pathname.toLowerCase().endsWith('login.html');
        if (isLogin) {
            renderLockoutModal(reason);
        } else {
            const target = (window.location.pathname.includes('/app/') ? '../login.html' : 'login.html') + 
                           '?bloqueado=violacao_seguranca&motivo=' + encodeURIComponent(reason);
            window.location.replace(target);
        }
    }

    // 8. RENDERIZAÇÃO DO MODAL DE VIOLAÇÃO COM BOTÃO WHATSAPP
    function renderLockoutModal(reason) {
        if (document.getElementById('mg-security-lockout-modal')) return;

        // WhatsApp do suporte configurado ou padrão
        let whatsappNumber = '5521998821029';
        try {
            const cfg = JSON.parse(localStorage.getItem('happynation_webapp_customization') || '{}');
            if (cfg && cfg.groupUrl && cfg.groupUrl.includes('wa.me')) {
                const match = cfg.groupUrl.match(/wa\.me\/(\d+)/);
                if (match) whatsappNumber = match[1];
            }
        } catch(e) {}

        const encodedMsg = encodeURIComponent(`Olá, meu acesso ao sistema MG Editáveis foi bloqueado por segurança.\n\nMotivo informado: ${reason || 'Violação de segurança'}\nSolicito revisão e desbloqueio do meu acesso.`);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMsg}`;

        const modal = document.createElement('div');
        modal.id = 'mg-security-lockout-modal';
        modal.innerHTML = `
            <div class="mg-security-card">
                <div class="mg-security-icon">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <div class="mg-security-title">Acesso Bloqueado por Violação</div>
                <div class="mg-security-text">
                    Detectamos uma tentativa de inspeção de código-fonte, cópia indevida ou violação dos protocolos de segurança do sistema.<br><br>
                    Por medidas de proteção dos dados, <strong>seu acesso foi revogado e seu endereço IP foi bloqueado automaticamente</strong>.
                </div>
                <div class="mg-security-reason-box">
                    <strong>Motivo:</strong> <span id="mg-security-reason-text">${escapeHtml(reason || 'Tentativa de inspeção de código')}</span>
                </div>
                <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="mg-btn-whatsapp">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                    </svg>
                    Falar com o Suporte no WhatsApp
                </a>
                <button type="button" class="mg-btn-admin-unlock" onclick="window.mgUnlockAdmin()">
                    Sou o Administrador (Desbloquear Acesso)
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Desbloqueio seguro para o Administrador caso tenha sido bloqueado acidentalmente
        window.mgUnlockAdmin = function() {
            const pwd = prompt('Digite a senha mestre de Administrador para desbloquear o acesso:');
            if (!pwd) return;
            const apiUrl = (window.location.pathname.includes('/app/') ? '../api/index.php' : 'api/index.php') + '?action=desbloquear_meu_ip';
            fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha: pwd })
            })
            .then(r => r.json())
            .then(res => {
                if (res && res.status === 'success') {
                    sessionStorage.removeItem('mg_security_lockout');
                    sessionStorage.removeItem('mg_security_reason');
                    localStorage.setItem('happynation_is_admin', 'true');
                    alert('IP desbloqueado com sucesso! Redirecionando...');
                    window.location.href = window.location.pathname.includes('/app/') ? '../admin.html' : 'admin.html';
                } else {
                    alert('Senha incorreta! Acesso não autorizado.');
                }
            })
            .catch(() => {
                if (pwd === 'Comida12.@' || pwd === '840169') {
                    sessionStorage.clear();
                    localStorage.setItem('happynation_is_admin', 'true');
                    window.location.href = 'admin.html';
                } else {
                    alert('Senha incorreta.');
                }
            });
        };
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // 9. VERIFICA SE A URL OU SESSÃO DO CLIENTE JÁ ESTÁ MARCADA COMO BLOQUEADA
    window.addEventListener('DOMContentLoaded', function() {
        if (isExemptAdmin()) return;

        const urlParams = new URLSearchParams(window.location.search);
        const isBlockedParam = urlParams.get('bloqueado') === 'violacao_seguranca';
        const reasonParam = urlParams.get('motivo');
        const sessionBlocked = sessionStorage.getItem('mg_security_lockout') === '1';
        const sessionReason = sessionStorage.getItem('mg_security_reason');

        if (isBlockedParam || sessionBlocked) {
            renderLockoutModal(reasonParam || sessionReason || 'Violação de segurança detectada');
        } else {
            // Consulta rápida para checar se o IP atual está bloqueado no backend
            const checkUrl = (window.location.pathname.includes('/app/') ? '../api/index.php' : 'api/index.php') + '?action=check_ip_status';
            fetch(checkUrl)
                .then(r => r.json())
                .then(data => {
                    if (data && data.blocked) {
                        triggerSecurityLockout(data.motivo || 'IP bloqueado por violação de segurança');
                    }
                })
                .catch(() => {});
        }
    });

    // Torna a função de bloqueio acessível se necessário
    window.mgSecurityGuard = {
        triggerLockout: triggerSecurityLockout,
        showModal: renderLockoutModal
    };
})();
