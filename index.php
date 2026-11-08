<?php
/**
 * Root index.php - Compatibilidade XAMPP / Apache
 * Se acessado diretamente pelo navegador sem parâmetros de API, exibe a página principal index.html.
 * Se contiver parâmetros de API (ex: ?action=login), encaminha para api/index.php.
 */
if (empty($_GET['action']) && empty($_POST['action']) && empty($_SERVER['HTTP_UPGRADE_INSECURE_REQUESTS'] == '1' && !empty($_GET))) {
    if (file_exists(__DIR__ . '/index.html')) {
        // Serve a landing page oficial
        include __DIR__ . '/index.html';
        exit();
    }
}

require_once __DIR__ . '/api/index.php';
