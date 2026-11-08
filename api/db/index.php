<?php
require_once dirname(__DIR__) . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$COLECOES = ['users', 'cnhs', 'recargas', 'tickets', 'activities', 'roadmap'];

// Determina coleção e parâmetros adicionais da URL
// Suporta tanto query parameter (via rewrite: ?path=users/123) quanto PATH_INFO (/api/db/index.php/users/123)
$rawPath = $_GET['path'] ?? $_SERVER['PATH_INFO'] ?? '';
$rawPath = trim($rawPath, '/');

// Se não tiver pelo rewrite, analisa da URI
if (empty($rawPath)) {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    if (preg_match('#/api/db/(.+)#i', $uri, $m)) {
        $rawPath = trim($m[1], '/');
    }
}

$parts = explode('/', $rawPath);
$colecao = strtolower($parts[0] ?? '');
$extra = $parts[1] ?? '';

if (!in_array($colecao, $COLECOES)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => "Coleção inválida: '{$colecao}'"]);
    exit();
}

$db = readDbJson();

// 1. GET /api/db/:colecao
if ($method === 'GET' && empty($extra)) {
    $data = $db[$colecao] ?? [];
    echo json_encode([
        'status' => 'ok',
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 2. POST /api/db/:colecao/clear
if ($method === 'POST' && $extra === 'clear') {
    $db[$colecao] = [];
    writeDbJson($db);
    echo json_encode([
        'status' => 'ok',
        'message' => "Coleção '{$colecao}' limpa com sucesso."
    ]);
    exit();
}

// 2.5 POST /api/db/:colecao/set ou replace (substituição total da coleção)
if ($method === 'POST' && in_array($extra, ['set', 'replace'])) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) $payload = [];
    $items = isset($payload[0]) ? $payload : ($payload['items'] ?? $payload['data'] ?? $payload['roadmap'] ?? []);
    if (!is_array($items) && is_array($payload)) $items = $payload;
    $db[$colecao] = array_values($items);
    writeDbJson($db);
    echo json_encode([
        'status' => 'ok',
        'message' => "Coleção '{$colecao}' atualizada com sucesso.",
        'data' => $db[$colecao]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 3. POST /api/db/:colecao (upsert)
if ($method === 'POST' && empty($extra)) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true);
    if (!is_array($payload)) $payload = $_POST;

    if (!isset($db[$colecao]) || !is_array($db[$colecao])) {
        $db[$colecao] = [];
    }

    $items = isset($payload[0]) ? $payload : [$payload];
    $saved = 0;
    $nowIso = date('c');

    foreach ($items as $item) {
        if (!is_array($item)) continue;

        // Se for coleção users, valida e-mail único e saldo 0.00
        if ($colecao === 'users') {
            $itemEmail = strtolower(trim($item['email'] ?? ''));
            $itemId = (string)($item['id'] ?? '');

            if (!empty($itemEmail)) {
                foreach ($db[$colecao] as $ex) {
                    $exEmail = strtolower(trim($ex['email'] ?? ''));
                    $exId = (string)($ex['id'] ?? '');
                    if ($exEmail === $itemEmail && (!empty($itemId) ? $exId !== $itemId : true)) {
                        http_response_code(400);
                        echo json_encode(['status' => 'error', 'message' => 'Este e-mail já está cadastrado no sistema. Não é permitido criar novamente.'], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                }
            }
            if (!isset($item['saldo']) || $item['saldo'] === '' || $item['saldo'] === null) {
                $item['saldo'] = 0.00;
            }
        }
        if (empty($item['id'])) {
            $item['id'] = time() . '_' . substr(md5(uniqid(rand(), true)), 0, 6);
        }
        $item['updated_at'] = $nowIso;

        $foundIdx = -1;
        foreach ($db[$colecao] as $idx => $r) {
            if (isset($r['id']) && (string)$r['id'] === (string)$item['id']) {
                $foundIdx = $idx;
                break;
            }
            if ($colecao === 'users' && !empty($r['email']) && !empty($item['email']) && strtolower($r['email']) === strtolower($item['email'])) {
                $foundIdx = $idx;
                break;
            }
        }

        if ($foundIdx !== -1) {
            $db[$colecao][$foundIdx] = array_merge($db[$colecao][$foundIdx], $item);
        } else {
            if (empty($item['created_at'])) $item['created_at'] = $nowIso;
            array_unshift($db[$colecao], $item);
        }
        $saved++;
    }

    writeDbJson($db);
    echo json_encode([
        'status' => 'ok',
        'message' => "{$saved} registro(s) salvos na coleção '{$colecao}'.",
        'data' => $db[$colecao]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// 4. DELETE /api/db/:colecao/:id
if ($method === 'DELETE' && !empty($extra)) {
    $before = count($db[$colecao] ?? []);
    $db[$colecao] = array_values(array_filter($db[$colecao] ?? [], function($r) use ($extra) {
        return (string)($r['id'] ?? '') !== (string)$extra;
    }));
    $removed = $before - count($db[$colecao]);
    writeDbJson($db);

    echo json_encode([
        'status' => 'ok',
        'message' => "{$removed} registro(s) removido(s) da coleção '{$colecao}'."
    ]);
    exit();
}

http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Requisição inválida.']);
