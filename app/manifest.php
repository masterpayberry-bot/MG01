<?php
header('Content-Type: application/manifest+json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../api/config.php';

$name = "CNH do Brasil";
$shortName = "CNH do Brasil";
$themeColor = "#1d5cc7";

if (isset($pdo) && $pdo) {
    try {
        $stmt = $pdo->query("SELECT valor FROM configuracoes WHERE chave = 'webapp_customization' LIMIT 1");
        $row = $stmt->fetch();
        if ($row && !empty($row['valor'])) {
            $cfg = json_decode($row['valor'], true);
            if (!empty($cfg['pwaTitle'])) {
                $name = $cfg['pwaTitle'];
                $shortName = $cfg['pwaTitle'];
            }
            if (!empty($cfg['btnColor'])) {
                $themeColor = $cfg['btnColor'];
            }
        }
    } catch(Exception $e) {}
}

$manifest = [
    "id" => "/app/",
    "short_name" => $shortName,
    "name" => $name,
    "description" => "Carteira Digital de Trânsito Oficial",
    "icons" => [
        [
            "src" => "icon-192.png",
            "sizes" => "192x192",
            "type" => "image/png",
            "purpose" => "any maskable"
        ],
        [
            "src" => "icon-512.png",
            "sizes" => "512x512",
            "type" => "image/png",
            "purpose" => "any maskable"
        ]
    ],
    "start_url" => "index.html?mode=standalone",
    "scope" => "./",
    "background_color" => "#ffffff",
    "theme_color" => $themeColor,
    "display" => "standalone",
    "orientation" => "portrait"
];

echo json_encode($manifest, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
