<?php
require_once dirname(__DIR__) . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? '';

if ($method === 'GET') {
    $cfg = readConfigJson();
    echo json_encode([
        'status' => 'ok',
        'data' => $cfg
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function saveConfigBase64Image($b64OrUrl, $filenameBase) {
    if (empty($b64OrUrl) || !is_string($b64OrUrl)) return $b64OrUrl;
    if (strpos($b64OrUrl, 'data:image/') !== 0) {
        if (strpos($b64OrUrl, 'uploads/logos/') === 0) {
            $cleanFile = preg_replace('/\?.*$/', '', $b64OrUrl);
            $checkPath = dirname(dirname(__DIR__)) . '/' . $cleanFile;
            if (!file_exists($checkPath) || filesize($checkPath) === 0) {
                return '';
            }
        }
        return $b64OrUrl;
    }
    $uploadsDir = dirname(dirname(__DIR__)) . '/uploads/logos';
    if (!is_dir($uploadsDir)) @mkdir($uploadsDir, 0777, true);
    @chmod($uploadsDir, 0777);
    $ext = (strpos($b64OrUrl, 'data:image/jpeg') === 0 || strpos($b64OrUrl, 'data:image/jpg') === 0) ? 'jpg' : 'png';
    $filename = $filenameBase . '.' . $ext;
    $destPath = $uploadsDir . '/' . $filename;
    $parts = explode(',', $b64OrUrl);
    if (count($parts) >= 2) {
        $bin = base64_decode($parts[1]);
        if ($bin !== false && strlen($bin) > 0) {
            $written = @file_put_contents($destPath, $bin);
            if ($written !== false && $written > 0) {
                @chmod($destPath, 0666);
                return 'uploads/logos/' . $filename . '?v=' . time();
            }
        }
    }
    return $b64OrUrl;
}

if ($method === 'POST') {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) $payload = $_POST;

    if (!empty($payload['logoImage'])) $payload['logoImage'] = saveConfigBase64Image($payload['logoImage'], 'logo_webapp');
    if (!empty($payload['govHeaderLogo'])) $payload['govHeaderLogo'] = saveConfigBase64Image($payload['govHeaderLogo'], 'logo_gov');
    if (!empty($payload['heroBanner'])) $payload['heroBanner'] = saveConfigBase64Image($payload['heroBanner'], 'hero_banner');
    if (!empty($payload['footerSerproImg'])) $payload['footerSerproImg'] = saveConfigBase64Image($payload['footerSerproImg'], 'footer_serpro');
    if (!empty($payload['footerCnhImg'])) $payload['footerCnhImg'] = saveConfigBase64Image($payload['footerCnhImg'], 'footer_cnh');
    if (!empty($payload['footerMinisterioImg'])) $payload['footerMinisterioImg'] = saveConfigBase64Image($payload['footerMinisterioImg'], 'footer_ministerio');

    $currentCfg = readConfigJson();
    $merged = array_merge($currentCfg, $payload);
    writeConfigJson($merged);

    // Se MySQL estiver conectado, sincroniza também na tabela configuracoes
    if ($pdo) {
        try {
            foreach ($merged as $k => $v) {
                $valStr = is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE);
                $stmt = $pdo->prepare("INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?");
                $stmt->execute([$k, $valStr, $valStr]);
            }
        } catch(Exception $e) {}
    }

    echo json_encode([
        'status' => 'ok',
        'data' => $merged,
        'message' => 'Configuração salva com sucesso!'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

http_response_code(405);
echo json_encode(['status' => 'error', 'message' => 'Método não permitido']);
