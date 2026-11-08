<?php
// ============================================================
// og.php — Página de entrada com Open Graph dinâmico
// Quando o link é compartilhado no WhatsApp/redes sociais,
// o robô lê esses meta tags ANTES do JavaScript rodar.
// ============================================================

// Pega a URL base do servidor
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host     = $_SERVER['HTTP_HOST'] ?? 'localhost';
$baseUrl  = $protocol . '://' . $host;

// Caminho da pasta do app (relativo ao domínio)
$scriptDir = dirname($_SERVER['SCRIPT_NAME']);
$appUrl    = rtrim($baseUrl . $scriptDir, '/');

// ─── Valores padrão ───────────────────────────────────────
$ogTitle       = 'CNH DO BRASIL';
$ogDescription = 'Carteira Digital de Trânsito - Apresente sua CNH Digital com QR Code em tempo real.';
$ogImage       = $appUrl . '/app/og-default.png'; // imagem padrão local
$ogUrl         = $appUrl . '/app/';

// ─── Tenta ler configuração salva do banco MySQL ──────────
$DB_HOST = 'localhost';
$DB_USER = 'juli1036_vendas';
$DB_PASS = 'Comida12.';
$DB_NAME = 'juli1036_mg';

try {
    $pdo = new PDO("mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    // Busca a configuração mais recente do webapp salva pelo Admin no MySQL
    $stmt = $pdo->query("SELECT valor FROM configuracoes WHERE chave = 'webapp_customization' LIMIT 1");
    $row  = $stmt->fetch();

    if ($row && !empty($row['valor'])) {
        $cfg = json_decode($row['valor'], true);

        if (!empty($cfg['pwaTitle']))      $ogTitle = $cfg['pwaTitle'];
        if (!empty($cfg['logoImage']))     $ogImage = $cfg['logoImage'];
        if (!empty($cfg['ogDescription'])) $ogDescription = $cfg['ogDescription'];
    }
} catch (Exception $e) {
    // Silencia erros — tenta arquivo local de fallback
}

// ─── Fallback: lê logo salvo pelo app JS via save-og-image.php ───
if ($ogImage === $appUrl . '/app/og-default.png') {
    $localFile = __DIR__ . '/app/og-image-admin.txt';
    if (file_exists($localFile)) {
        $savedImage = trim(file_get_contents($localFile));
        if (!empty($savedImage)) {
            $ogImage = $savedImage;
        }
    }
}


// ─── Redireciona agentes reais (navegadores) para o app ───
// Robôs sociais NÃO seguem JS redirects mas SIM leem HTML.
// Por isso renderizamos o HTML completo aqui para robôs,
// e adicionamos um meta redirect + JS para usuários normais.
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';
$isCrawler = preg_match('/whatsapp|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|discordbot|googlebot|bingbot|curl|wget/i', $userAgent);
?>
<!DOCTYPE html>
<html lang="pt-BR" prefix="og: https://ogp.me/ns#">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($ogTitle) ?></title>

    <!-- ─── Open Graph (WhatsApp / Facebook / Telegram) ─── -->
    <meta property="og:type"        content="website">
    <meta property="og:site_name"   content="<?= htmlspecialchars($ogTitle) ?>">
    <meta property="og:title"       content="<?= htmlspecialchars($ogTitle) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($ogDescription) ?>">
    <meta property="og:image"       content="<?= htmlspecialchars($ogImage) ?>">
    <meta property="og:image:width"  content="512">
    <meta property="og:image:height" content="512">
    <meta property="og:url"         content="<?= htmlspecialchars($ogUrl) ?>">

    <!-- ─── Twitter Card ─── -->
    <meta name="twitter:card"        content="summary_large_image">
    <meta name="twitter:title"       content="<?= htmlspecialchars($ogTitle) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($ogDescription) ?>">
    <meta name="twitter:image"       content="<?= htmlspecialchars($ogImage) ?>">

    <!-- ─── PWA / Mobile ─── -->
    <meta name="theme-color"                  content="#1d5cc7">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title"   content="<?= htmlspecialchars($ogTitle) ?>">

    <!-- Redireciona o usuário real para o app (robô NÃO segue) -->
    <?php if (!$isCrawler): ?>
    <meta http-equiv="refresh" content="0;url=app/">
    <script>window.location.replace('app/');</script>
    <?php endif; ?>

    <style>
        /* Tela de carregamento enquanto redireciona */
        body { margin:0; background:#fff; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; }
        .loader { text-align:center; }
        .loader img { max-width:160px; max-height:160px; object-fit:contain; animation: pulse 1.5s ease-in-out infinite; }
        .loader p { color:#888; font-size:14px; margin-top:18px; }
        @keyframes pulse { 0%,100%{opacity:.7;transform:scale(.97)} 50%{opacity:1;transform:scale(1)} }
    </style>
</head>
<body>
    <div class="loader">
        <img src="<?= htmlspecialchars($ogImage) ?>" alt="<?= htmlspecialchars($ogTitle) ?>">
        <p>Carregando...</p>
    </div>
</body>
</html>
