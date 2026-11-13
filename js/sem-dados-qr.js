/* Aviso exibido quando o QR Code lido NÃO traz os dados do documento.
   Evita mostrar dados fictícios / de outra pessoa nas páginas de validação. */
(function () {
    function criar() {
        if (document.getElementById('mgSemDados')) return;
        var b = document.createElement('div');
        b.id = 'mgSemDados';
        b.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#0b0d0e;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:28px;font-family:Arial,Helvetica,sans-serif;';
        b.innerHTML = '<div style="max-width:420px">' +
            '<div style="font-size:44px;margin-bottom:10px">⚠️</div>' +
            '<h2 style="font-size:20px;margin:0 0 10px;font-weight:800">Dados do documento indisponíveis</h2>' +
            '<p style="font-size:14px;line-height:1.5;color:#9aa2a6;margin:0">Este QR Code não trouxe os dados do documento. ' +
            'Leia novamente o QR Code impresso no documento original para validar.</p></div>';
        (document.body || document.documentElement).appendChild(b);
    }
    window.mgSemDados = function () {
        if (document.body) criar();
        else document.addEventListener('DOMContentLoaded', criar);
    };
    window.mgSemDadosRemover = function () {
        var e = document.getElementById('mgSemDados');
        if (e && e.parentNode) e.parentNode.removeChild(e);
    };
})();
