<?php
// ============================================================
// api/save-og-image.php
// Salva a URL/base64 da imagem OG (logo do admin)
// em um arquivo og-image.txt para uso pelo og.php
// ============================================================

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

$input = json_decode(file_get_contents('php://input'), true);
$imageData = $input['image'] ?? '';

if (empty($imageData)) {
    echo json_encode(['status' => 'error', 'message' => 'Nenhuma imagem enviada.']);
    exit;
}

// Tenta salvar como base64 em um arquivo acessível
$savePath = __DIR__ . '/../app/og-image-admin.txt';
file_put_contents($savePath, $imageData);

echo json_encode(['status' => 'success', 'message' => 'Imagem OG salva com sucesso.']);
