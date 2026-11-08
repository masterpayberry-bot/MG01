<?php
// ============================================================
// admin.php — PORTAL ADMINISTRATIVO COM CLOAKER SERVER-SIDE
// Intercepta acessos a /admin antes de renderizar qualquer HTML
// ============================================================

$config = [];

// 1. Tenta ler do app/config.json
$configPath = __DIR__ . '/app/config.json';
if (file_exists($configPath)) {
    $raw = @file_get_contents($configPath);
    $config = @json_decode($raw, true) ?: [];
}

// 2. Consulta banco MySQL se disponível para garantir sincronização em tempo real
try {
    if (file_exists(__DIR__ . '/api/config.php')) {
        require_once __DIR__ . '/api/config.php';
        if (isset($pdo) && $pdo) {
            $stmt = $pdo->query("SELECT chave, valor FROM configuracoes WHERE chave LIKE 'cloaker%' OR chave = 'webapp_customization'");
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                if ($row['chave'] === 'webapp_customization') {
                    $cWeb = json_decode($row['valor'], true);
                    if (is_array($cWeb)) {
                        foreach ($cWeb as $ck => $cv) {
                            if (strpos($ck, 'cloaker') === 0 && !isset($config[$ck])) {
                                $config[$ck] = $cv;
                            }
                        }
                    }
                } else {
                    $val = json_decode($row['valor'], true);
                    $config[$row['chave']] = ($val !== null) ? $val : $row['valor'];
                }
            }
        }
    }
} catch(Exception $e) {}

$cloakerVal = $config['cloakerAdminEnabled'] ?? false;
$cloakerEnabled = ($cloakerVal === true || $cloakerVal === 'true' || $cloakerVal === 1 || $cloakerVal === '1');

$expectedKey = trim((string)($config['cloakerAdminKey'] ?? 'adm_171'));
$paramName   = trim((string)($config['cloakerAdminParam'] ?? 'key'));
$redirectUrl = trim((string)($config['cloakerAdminRedirect'] ?? 'login.html'));
if (empty($redirectUrl)) $redirectUrl = 'login.html';

if ($cloakerEnabled && !empty($expectedKey)) {
    $providedKey = '';

    // 1. Tenta obter o slug vindo da rota /admin_CODIGO (via reescrita do .htaccess)
    if (!empty($_GET['admin_slug'])) {
        $providedKey = trim($_GET['admin_slug']);
    } else {
        // Tenta capturar diretamente da URI do servidor
        $uri = $_SERVER['REQUEST_URI'] ?? '';
        $pathOnly = parse_url($uri, PHP_URL_PATH);
        if (preg_match('/\/admin_([a-zA-Z0-9_\-]+)/i', $pathOnly, $matches)) {
            $providedKey = trim($matches[1]);
        }
    }

    // 2. Tenta capturar dos query parameters (?key=... ou ?param=...)
    if (empty($providedKey)) {
        if (!empty($_GET[$paramName])) {
            $providedKey = trim($_GET[$paramName]);
        } elseif (!empty($_GET['key'])) {
            $providedKey = trim($_GET['key']);
        }
    }

    // Se o cloaker está ATIVO e a chave NÃO confere: BLOQUEIA E REDIRECIONA NO NÍVEL DO SERVIDOR
    if ($providedKey !== $expectedKey) {
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Location: ' . $redirectUrl);
        exit();
    }
}

// Cloaker inativo ou chave validada com sucesso: serve o painel administrativo
header('Content-Type: text/html; charset=UTF-8');
require __DIR__ . '/admin.html';
exit();
