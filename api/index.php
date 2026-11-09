<?php
require_once __DIR__ . '/config.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawInput = file_get_contents('php://input');
$inputData = json_decode($rawInput, true);
if (!is_array($inputData)) $inputData = $_POST;
if (!is_array($inputData)) $inputData = [];

// Mescla com parâmetros GET para conveniência
$inputData = array_merge($_GET, $inputData);

// ------------------------------------------------------------
// FUNÇÕES AUXILIARES DE SEGURANÇA E IP
// ------------------------------------------------------------
function getClientIp() {
    $ip = '';
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ips = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $ip = trim($ips[0]);
    } elseif (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
        $ip = $_SERVER['REMOTE_ADDR'];
    }
    if (strpos($ip, ':') !== false && strpos($ip, '.') !== false) {
        $parts = explode(':', $ip);
        $ip = $parts[0];
    }
    return trim($ip);
}

function initSecuritySchema($pdo) {
    if (!$pdo) return;
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `ips_bloqueados` (
            `id` INT(11) NOT NULL AUTO_INCREMENT,
            `ip` VARCHAR(64) NOT NULL,
            `motivo` VARCHAR(255) NOT NULL,
            `user_id` INT(11) DEFAULT NULL,
            `user_email` VARCHAR(150) DEFAULT NULL,
            `user_agent` TEXT DEFAULT NULL,
            `data` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_ip` (`ip`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

        $cols = $pdo->query("SHOW COLUMNS FROM usuarios LIKE 'register_ip'")->fetchAll();
        if (empty($cols)) {
            @$pdo->exec("ALTER TABLE usuarios ADD COLUMN `register_ip` VARCHAR(64) DEFAULT NULL");
            @$pdo->exec("ALTER TABLE usuarios ADD COLUMN `last_ip` VARCHAR(64) DEFAULT NULL");
        }
    } catch(Exception $e) {}
}

function checkIpBlocked($ip, $pdo) {
    if (empty($ip)) return false;
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT id, ip, motivo, data FROM ips_bloqueados WHERE ip = ? LIMIT 1");
            $stmt->execute([$ip]);
            $row = $stmt->fetch();
            if ($row) return $row;
        } catch(Exception $e) {}
    }

    $db = readDbJson();
    $blocked = $db['blocked_ips'] ?? [];
    foreach ($blocked as $b) {
        if (isset($b['ip']) && trim($b['ip']) === trim($ip)) {
            return $b;
        }
    }
    return false;
}

// Salva imagens Base64 como arquivos físicos reais e permanentes no disco
function saveBase64ImageFile($b64OrUrl, $subDir, $filenameBase) {
    if (empty($b64OrUrl) || !is_string($b64OrUrl)) return $b64OrUrl;
    // Se não for data:image, já é URL ou caminho existente
    if (strpos($b64OrUrl, 'data:image/') !== 0) {
        if (strpos($b64OrUrl, 'uploads/' . $subDir . '/') === 0) {
            $cleanFile = preg_replace('/\?.*$/', '', $b64OrUrl);
            $checkPath = dirname(__DIR__) . '/' . $cleanFile;
            if (!file_exists($checkPath) || filesize($checkPath) === 0) {
                return '';
            }
        }
        return $b64OrUrl;
    }

    $uploadsDir = dirname(__DIR__) . '/uploads/' . $subDir;
    if (!is_dir($uploadsDir)) {
        @mkdir($uploadsDir, 0777, true);
    }
    @chmod($uploadsDir, 0777);

    $ext = 'png';
    if (strpos($b64OrUrl, 'data:image/jpeg') === 0 || strpos($b64OrUrl, 'data:image/jpg') === 0) {
        $ext = 'jpg';
    } elseif (strpos($b64OrUrl, 'data:image/webp') === 0) {
        $ext = 'webp';
    } elseif (strpos($b64OrUrl, 'data:image/svg+xml') === 0) {
        $ext = 'svg';
    }

    $filename = $filenameBase . '.' . $ext;
    $destPath = $uploadsDir . '/' . $filename;

    $parts = explode(',', $b64OrUrl);
    if (count($parts) >= 2) {
        $rawB64 = str_replace(' ', '+', $parts[1]);
        $data = base64_decode($rawB64);
        if ($data !== false && strlen($data) > 0) {
            $written = @file_put_contents($destPath, $data);
            if ($written !== false && $written > 0) {
                @chmod($destPath, 0666);
                return 'uploads/' . $subDir . '/' . $filename . '?v=' . time();
            }
        }
    }
    // Se a gravação em disco falhar por permissão, mantém o Base64 Data URI para nunca perder a imagem
    return $b64OrUrl;
}

// Inicializa tabelas de segurança no MySQL se disponível
initSecuritySchema($pdo);

// ------------------------------------------------------------
// ROTEAMENTO DAS AÇÕES
// ------------------------------------------------------------
switch ($action) {

    // ------------------------------------------------------------
    // 1. AUTENTICAÇÃO (LOGIN & REGISTRO COM RESTRIÇÃO ESTRITA DE IP)
    // ------------------------------------------------------------
    case 'login':
        $clientIp = getClientIp();
        $email = trim($inputData['email'] ?? '');
        $senha = trim($inputData['senha'] ?? '');
        $cleanEmail = strtolower($email);

        $isAdminAttempt = ($cleanEmail === 'mg' || $cleanEmail === 'admin');

        // Checa bloqueio de IP para clientes
        if (!$isAdminAttempt) {
            $blockInfo = checkIpBlocked($clientIp, $pdo);
            if ($blockInfo) {
                jsonResponse('error', [
                    'blocked' => true,
                    'ip' => $clientIp,
                    'motivo' => $blockInfo['motivo'] ?? 'Acesso bloqueado por violação de segurança',
                    'whatsapp' => '5521998821029',
                    'whatsapp_url' => 'https://wa.me/5521998821029?text=' . urlencode('Olá, meu IP (' . $clientIp . ') está bloqueado no MG Editáveis. Solicito liberação.')
                ], 'Acesso bloqueado por violação de segurança. Entre em contato com o suporte no WhatsApp.');
            }
        }

        if (empty($email) || empty($senha)) {
            jsonResponse('error', null, 'Preencha o e-mail e a senha.');
        }

        // 1. Administrador Geral Oficial: Login MG | Senha: Comida12.@
        if ($cleanEmail === 'mg') {
            if ($senha !== 'Comida12.@') {
                jsonResponse('error', null, 'Senha de Administrador incorreta.');
            }
            $adminUser = [
                'id' => 1,
                'nome' => 'Administrador Geral MG',
                'email' => 'MG',
                'role' => 'admin',
                'status' => 'approved',
                'saldo' => 9999.00
            ];
            jsonResponse('success', $adminUser, 'Login administrativo autorizado!');
        }

        // 2. Validação obrigatória no banco de dados MySQL para Clientes
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE LOWER(TRIM(email)) = ? LIMIT 1");
                $stmt->execute([$cleanEmail]);
                $user = $stmt->fetch();

                if (!$user) {
                    jsonResponse('error', null, 'Usuário não cadastrado no banco de dados.');
                }

                if ($user['senha'] !== $senha && !password_verify($senha, $user['senha'])) {
                    jsonResponse('error', null, 'Senha incorreta.');
                }

                if (($user['status'] ?? '') === 'blocked') {
                    jsonResponse('error', null, 'Sua conta está bloqueada pelo Administrador.');
                }

                if (($user['status'] ?? '') === 'pending') {
                    $whatsUrl = 'https://wa.me/5521998821029?text=' . urlencode('Olá, meu cadastro no MG Editáveis (' . ($user['email'] ?? $cleanEmail) . ') ainda está em análise. Gostaria de agilizar a aprovação do meu acesso.');
                    jsonResponse('error', [
                        'pending' => true,
                        'nome' => $user['nome'] ?? '',
                        'email' => $user['email'] ?? $cleanEmail,
                        'whatsapp_url' => $whatsUrl
                    ], 'Cadastro em análise! Seu acesso ainda não foi liberado pelo Administrador. Fale com o suporte no WhatsApp para agilizar sua aprovação.');
                }

                try {
                    $pdo->prepare("UPDATE usuarios SET last_ip = ? WHERE id = ?")->execute([$clientIp, $user['id']]);
                } catch(Exception $ex) {}

                unset($user['senha']);
                jsonResponse('success', $user, 'Login realizado com sucesso!');
            } catch(Exception $e) {}
        }

        // 3. Fallback no JSON apenas se existir no arquivo
        $db = readDbJson();
        $found = null;
        foreach (($db['users'] ?? []) as &$u) {
            if (isset($u['email']) && strtolower(trim($u['email'])) === $cleanEmail) {
                $found = $u;
                $u['last_ip'] = $clientIp;
                writeDbJson($db);
                break;
            }
        }

        if ($found) {
            if (isset($found['senha']) && $found['senha'] !== $senha) {
                jsonResponse('error', null, 'Senha incorreta.');
            }
            if (($found['status'] ?? '') === 'blocked') {
                jsonResponse('error', null, 'Sua conta está bloqueada pelo Administrador.');
            }
            if (($found['status'] ?? '') === 'pending') {
                $whatsUrl = 'https://wa.me/5521998821029?text=' . urlencode('Olá, meu cadastro no MG Editáveis (' . ($found['email'] ?? $cleanEmail) . ') ainda está em análise. Gostaria de agilizar a aprovação do meu acesso.');
                jsonResponse('error', [
                    'pending' => true,
                    'nome' => $found['nome'] ?? '',
                    'email' => $found['email'] ?? $cleanEmail,
                    'whatsapp_url' => $whatsUrl
                ], 'Cadastro em análise! Seu acesso ainda não foi liberado pelo Administrador. Fale com o suporte no WhatsApp para agilizar sua aprovação.');
            }
            unset($found['senha']);
            jsonResponse('success', $found, 'Login realizado com sucesso!');
        }

        jsonResponse('error', null, 'Usuário não cadastrado no banco de dados.');
        break;

    case 'register':
        $clientIp = getClientIp();

        // Checa se o IP já está bloqueado
        $blockInfo = checkIpBlocked($clientIp, $pdo);
        if ($blockInfo) {
            jsonResponse('error', [
                'blocked' => true,
                'ip' => $clientIp,
                'motivo' => $blockInfo['motivo'] ?? 'Acesso bloqueado por violação de segurança',
                'whatsapp' => '5521998821029',
                'whatsapp_url' => 'https://wa.me/5521998821029?text=' . urlencode('Olá, meu IP (' . $clientIp . ') está bloqueado no MG Editáveis. Solicito liberação.')
            ], 'Seu endereço IP está bloqueado por violação de segurança. Fale com o suporte no WhatsApp.');
        }

        $nome = trim($inputData['nome'] ?? '');
        $email = trim($inputData['email'] ?? '');
        $senha = trim($inputData['senha'] ?? '');
        $phone = trim($inputData['phone'] ?? '');
        $cleanEmail = strtolower($email);

        if (empty($nome) || empty($email) || empty($senha)) {
            jsonResponse('error', null, 'Nome, e-mail e senha são obrigatórios.');
        }

        // 1. NÃO PERMITE DUPLICIDADE DE E-MAIL
        if ($pdo) {
            try {
                $stmtEmail = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(TRIM(email)) = ? LIMIT 1");
                $stmtEmail->execute([$cleanEmail]);
                if ($stmtEmail->fetch()) {
                    jsonResponse('error', null, 'Este e-mail já está cadastrado no sistema. Não é permitido criar novamente.');
                }
            } catch(Exception $e) {}
        }

        $db = readDbJson();
        foreach (($db['users'] ?? []) as $u) {
            if (isset($u['email']) && strtolower(trim($u['email'])) === $cleanEmail) {
                jsonResponse('error', null, 'Este e-mail já está cadastrado no sistema. Não é permitido criar novamente.');
            }
        }

        // 2. REGRA RIGOROSA: APENAS 1 CONTA POR IP!
        // Se já existir conta criada por este IP, BLOQUEIA O IP IMEDIATAMENTE e manda abrir WhatsApp!
        $hasExistingAccount = false;
        if (!empty($clientIp)) {
            if ($pdo) {
                try {
                    $stmtIp = $pdo->prepare("SELECT id, email FROM usuarios WHERE (register_ip = ? OR last_ip = ?) AND role != 'admin' LIMIT 1");
                    $stmtIp->execute([$clientIp, $clientIp]);
                    if ($stmtIp->fetch()) {
                        $hasExistingAccount = true;
                    }
                } catch(Exception $e) {}
            }

            if (!$hasExistingAccount) {
                foreach (($db['users'] ?? []) as $u) {
                    $userIp = $u['register_ip'] ?? $u['ip'] ?? '';
                    if (!empty($userIp) && $userIp === $clientIp && ($u['role'] ?? '') !== 'admin') {
                        $hasExistingAccount = true;
                        break;
                    }
                }
            }
        }

        if ($hasExistingAccount) {
            $motivoBloqueio = 'Tentativa de criar múltiplas contas a partir do mesmo IP (' . $clientIp . ')';

            // Bloqueia imediatamente no MySQL
            if ($pdo) {
                try {
                    $stmtInsBlock = $pdo->prepare("INSERT INTO ips_bloqueados (ip, motivo, user_email, data) VALUES (?, ?, ?, NOW())");
                    $stmtInsBlock->execute([$clientIp, $motivoBloqueio, $email]);
                } catch(Exception $e) {}
            }

            // Bloqueia no JSON
            if (!isset($db['blocked_ips'])) $db['blocked_ips'] = [];
            $db['blocked_ips'][] = [
                'ip' => $clientIp,
                'motivo' => $motivoBloqueio,
                'user_email' => $email,
                'data' => date('c')
            ];
            writeDbJson($db);

            $whatsUrl = 'https://wa.me/5521998821029?text=' . urlencode('Olá, meu IP (' . $clientIp . ') foi bloqueado por tentativa de criação de segunda conta no MG Editáveis. Solicito liberação com o suporte.');

            jsonResponse('error', [
                'blocked' => true,
                'ip' => $clientIp,
                'motivo' => 'É permitido estritamente apenas 1 conta por cliente/dispositivo. O seu IP foi bloqueado por segurança.',
                'whatsapp' => '5521998821029',
                'whatsapp_url' => $whatsUrl
            ], 'Limite atingido: Já existe um cadastro realizado a partir deste endereço IP / dispositivo. É permitido estritamente apenas 1 conta por cliente. O seu IP foi bloqueado por segurança. Fale com o suporte no WhatsApp.');
        }

        // 3. Saldo inicial estritamente 0.00
        $saldoInicial = 0.00;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, senha, phone, saldo, role, status, register_ip, last_ip) VALUES (?, ?, ?, ?, 0.00, 'client', 'pending', ?, ?)");
                $stmt->execute([$nome, $cleanEmail, $senha, $phone, $clientIp, $clientIp]);
                $newId = $pdo->lastInsertId();

                $db = readDbJson();
                $db['users'][] = [
                    'id' => (int)$newId,
                    'nome' => $nome,
                    'email' => $cleanEmail,
                    'phone' => $phone,
                    'saldo' => 0.00,
                    'role' => 'client',
                    'status' => 'pending',
                    'register_ip' => $clientIp,
                    'last_ip' => $clientIp,
                    'created_at' => date('c')
                ];
                writeDbJson($db);

                $whatsUrlReg = 'https://wa.me/5521998821029?text=' . urlencode('Olá, acabei de me cadastrar no MG Editáveis (' . $cleanEmail . ') e gostaria de solicitar a aprovação do meu cadastro.');
                jsonResponse('success', [
                    'id' => $newId,
                    'nome' => $nome,
                    'email' => $cleanEmail,
                    'status' => 'pending',
                    'pending' => true,
                    'whatsapp_url' => $whatsUrlReg
                ], 'Cadastro realizado com sucesso! Para sua segurança, o Administrador irá analisar e aprovar o seu cadastro.');
            } catch(PDOException $e) {
                if ($e->getCode() == 23000 || strpos($e->getMessage(), 'Duplicate') !== false) {
                    jsonResponse('error', null, 'Este e-mail já está cadastrado no sistema. Não é permitido criar novamente.');
                }
            }
        }

        $newId = time();
        $newUser = [
            'id' => $newId,
            'nome' => $nome,
            'email' => $cleanEmail,
            'senha' => $senha,
            'phone' => $phone,
            'saldo' => 0.00,
            'role' => 'client',
            'status' => 'pending',
            'register_ip' => $clientIp,
            'last_ip' => $clientIp,
            'created_at' => date('c')
        ];
        $db['users'][] = $newUser;
        writeDbJson($db);

        $whatsUrlReg = 'https://wa.me/5521998821029?text=' . urlencode('Olá, acabei de me cadastrar no MG Editáveis (' . $cleanEmail . ') e gostaria de solicitar a aprovação do meu cadastro.');
                jsonResponse('success', [
                    'id' => $newId,
                    'nome' => $nome,
                    'email' => $cleanEmail,
                    'status' => 'pending',
                    'pending' => true,
                    'whatsapp_url' => $whatsUrlReg
                ], 'Cadastro realizado com sucesso! Para sua segurança, o Administrador irá analisar e aprovar o seu cadastro.');
        break;

    // ------------------------------------------------------------
    // 2. GESTÃO ADM (USUÁRIOS, RECARGAS E CONFIGS)
    // ------------------------------------------------------------
    case 'get_admin_data':
        $configs = readConfigJson();
        $db = readDbJson();

        $users = $db['users'] ?? [];
        $recargas = $db['recargas'] ?? [];
        $cnhs = $db['cnhs'] ?? [];
        $blockedIps = $db['blocked_ips'] ?? [];

        if ($pdo) {
            try {
                $users = $pdo->query("SELECT id, nome, email, phone, saldo, role, status, register_ip, last_ip, created_at FROM usuarios ORDER BY id DESC")->fetchAll() ?: $users;
                $recargas = $pdo->query("SELECT * FROM recargas ORDER BY data DESC")->fetchAll() ?: $recargas;
                $cnhs = $pdo->query("SELECT * FROM cnhs ORDER BY created_at DESC")->fetchAll() ?: $cnhs;
                $blockedIps = $pdo->query("SELECT * FROM ips_bloqueados ORDER BY data DESC")->fetchAll() ?: $blockedIps;

                $stmtConfig = $pdo->query("SELECT * FROM configuracoes");
                while ($row = $stmtConfig->fetch()) {
                    $configs[$row['chave']] = $row['valor'];
                }
            } catch(Exception $e) {}
        }

        jsonResponse('success', [
            'users' => $users,
            'recargas' => $recargas,
            'cnhs' => $cnhs,
            'configs' => $configs,
            'blocked_ips' => $blockedIps,
            'roadmap' => $db['roadmap'] ?? []
        ]);
        break;

    case 'update_user_status':
        $userId = $inputData['userId'] ?? 0;
        $newStatus = $inputData['status'] ?? ''; // approved, blocked, pending

        if (!$userId || !in_array($newStatus, ['approved', 'blocked', 'pending'])) {
            jsonResponse('error', null, 'Dados inválidos.');
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("UPDATE usuarios SET status = ? WHERE id = ?");
                $stmt->execute([$newStatus, $userId]);
            } catch(Exception $e) {}
        }

        // Espelha no JSON
        $db = readDbJson();
        $userEmailReq = strtolower(trim($inputData['userEmail'] ?? ($inputData['email'] ?? '')));
        foreach ($db['users'] as &$u) {
            $matchId = (isset($u['id']) && (string)$u['id'] === (string)$userId);
            $matchEmail = (!empty($userEmailReq) && strtolower(trim($u['email'] ?? '')) === $userEmailReq);
            if ($matchId || $matchEmail) {
                $u['status'] = $newStatus;
                $u['updated_at'] = date('c');
                break;
            }
        }
        writeDbJson($db);

        jsonResponse('success', null, 'Status do usuário atualizado!');
        break;

        case 'deduct_balance':
        $userId = $inputData['userId'] ?? 0;
        $userEmail = strtolower(trim($inputData['userEmail'] ?? ($inputData['email'] ?? '')));
        $amount = floatval($inputData['amount'] ?? 0);
        $tipoDoc = trim($inputData['tipo'] ?? 'documento');

        if ($amount <= 0) {
            jsonResponse('error', null, 'Valor de débito inválido.');
        }

        $novoSaldo = 0;
        if ($pdo) {
            try {
                $user = null;
                if ($userId) {
                    $stmtUser = $pdo->prepare("SELECT id, saldo FROM usuarios WHERE id = ? LIMIT 1");
                    $stmtUser->execute([$userId]);
                    $user = $stmtUser->fetch();
                }
                if (!$user && !empty($userEmail)) {
                    $stmtUser = $pdo->prepare("SELECT id, saldo FROM usuarios WHERE LOWER(email) = ? LIMIT 1");
                    $stmtUser->execute([$userEmail]);
                    $user = $stmtUser->fetch();
                    if ($user) $userId = $user['id'];
                }
                if ($user) {
                    $novoSaldo = max(0, floatval($user['saldo']) - $amount);
                    $stmtDec = $pdo->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?");
                    $stmtDec->execute([$novoSaldo, $userId]);
                }
            } catch(Exception $e) {}
        }

        $db = readDbJson();
        foreach ($db['users'] as &$u) {
            $matchId = ($userId && isset($u['id']) && (string)$u['id'] === (string)$userId);
            $matchEmail = (!empty($userEmail) && strtolower(trim($u['email'] ?? '')) === $userEmail);
            if ($matchId || $matchEmail) {
                $u['saldo'] = max(0, floatval($u['saldo'] ?? 0) - $amount);
                $u['updated_at'] = date('c');
                $novoSaldo = $u['saldo'];
                break;
            }
        }
        writeDbJson($db);

        jsonResponse('success', ['novoSaldo' => $novoSaldo], "Saldo debitado com sucesso: R$ {$amount}");
        break;

    case 'add_user_balance':
        $userId = $inputData['userId'] ?? 0;
        $amount = floatval($inputData['amount'] ?? 0);

        if (!$userId || $amount <= 0) {
            jsonResponse('error', null, 'Informe um valor válido maior que R$ 0,00.');
        }

        $newBalance = 0;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?");
                $stmt->execute([$amount, $userId]);

                $stmtUser = $pdo->prepare("SELECT saldo FROM usuarios WHERE id = ?");
                $stmtUser->execute([$userId]);
                $newBalance = $stmtUser->fetchColumn();
            } catch(Exception $e) {}
        }

        // Espelha no JSON
        $db = readDbJson();
        foreach ($db['users'] as &$u) {
            if (isset($u['id']) && (string)$u['id'] === (string)$userId) {
                $u['saldo'] = floatval($u['saldo'] ?? 0) + $amount;
                $u['updated_at'] = date('c');
                $newBalance = $u['saldo'];
                break;
            }
        }
        writeDbJson($db);

        jsonResponse('success', ['newBalance' => $newBalance], 'Saldo adicionado com sucesso!');
        break;

    case 'delete_user':
        $userId = $inputData['id'] ?? $inputData['userId'] ?? 0;
        $userEmail = trim($inputData['email'] ?? '');

        if (!$userId && empty($userEmail)) {
            jsonResponse('error', null, 'Informe o ID ou E-mail do usuário para exclusão.');
        }

        // 1. Remove do MySQL
        if ($pdo) {
            try {
                if ($userId) {
                    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = ?");
                    $stmt->execute([$userId]);
                }
                if (!empty($userEmail)) {
                    $stmt = $pdo->prepare("DELETE FROM usuarios WHERE LOWER(email) = LOWER(?)");
                    $stmt->execute([$userEmail]);
                }
            } catch(Exception $e) {}
        }

        // 2. Remove do app/db.json
        $db = readDbJson();
        $db['users'] = array_values(array_filter($db['users'] ?? [], function($u) use ($userId, $userEmail) {
            if ($userId && (string)($u['id'] ?? '') === (string)$userId) return false;
            if (!empty($userEmail) && strtolower(trim($u['email'] ?? '')) === strtolower(trim($userEmail))) return false;
            return true;
        }));
        writeDbJson($db);

        jsonResponse('success', null, 'Cliente excluído com sucesso do sistema!');
        break;

    case 'save_user':
        $userId = $inputData['id'] ?? $inputData['userId'] ?? 0;
        $nome = trim($inputData['nome'] ?? '');
        $email = trim($inputData['email'] ?? '');
        $phone = trim($inputData['phone'] ?? '');
        $saldo = floatval($inputData['saldo'] ?? 0);
        $status = in_array($inputData['status'] ?? '', ['approved', 'pending', 'blocked']) ? $inputData['status'] : 'approved';

        if (empty($nome) || empty($email)) {
            jsonResponse('error', null, 'Nome e E-mail são obrigatórios.');
        }

        $db = readDbJson();
        $savedUser = null;

        if ($pdo) {
            try {
                if ($userId) {
                    $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, email = ?, phone = ?, saldo = ?, status = ? WHERE id = ?");
                    $stmt->execute([$nome, $email, $phone, $saldo, $status, $userId]);
                    $savedUser = ['id' => $userId, 'nome' => $nome, 'email' => $email, 'phone' => $phone, 'saldo' => $saldo, 'status' => $status];
                } else {
                    $stmtChk = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1");
                    $stmtChk->execute([$email]);
                    $exId = $stmtChk->fetchColumn();
                    if ($exId) {
                        $stmt = $pdo->prepare("UPDATE usuarios SET nome = ?, phone = ?, saldo = ?, status = ? WHERE id = ?");
                        $stmt->execute([$nome, $phone, $saldo, $status, $exId]);
                        $savedUser = ['id' => $exId, 'nome' => $nome, 'email' => $email, 'phone' => $phone, 'saldo' => $saldo, 'status' => $status];
                    } else {
                        $stmt = $pdo->prepare("INSERT INTO usuarios (nome, email, phone, saldo, status, role, senha) VALUES (?, ?, ?, ?, ?, 'client', ?)");
                        $stmt->execute([$nome, $email, $phone, $saldo, $status, password_hash('123456', PASSWORD_DEFAULT)]);
                        $newId = $pdo->lastInsertId();
                        $savedUser = ['id' => $newId, 'nome' => $nome, 'email' => $email, 'phone' => $phone, 'saldo' => $saldo, 'status' => $status];
                    }
                }
            } catch(Exception $e) {}
        }

        // Espelha no app/db.json
        $found = false;
        foreach ($db['users'] as &$u) {
            if (($userId && (string)($u['id'] ?? '') === (string)$userId) || (strtolower(trim($u['email'] ?? '')) === strtolower($email))) {
                $u['nome'] = $nome;
                $u['email'] = $email;
                $u['phone'] = $phone;
                $u['saldo'] = $saldo;
                $u['status'] = $status;
                $u['updated_at'] = date('c');
                $savedUser = $u;
                $found = true;
                break;
            }
        }
        if (!$found) {
            $newU = [
                'id' => $savedUser['id'] ?? (time() . rand(100, 999)),
                'nome' => $nome,
                'email' => $email,
                'phone' => $phone,
                'saldo' => $saldo,
                'status' => $status,
                'created_at' => date('c')
            ];
            $db['users'][] = $newU;
            $savedUser = $newU;
        }
        writeDbJson($db);

        jsonResponse('success', ['user' => $savedUser], 'Cliente salvo com sucesso!');
        break;

    case 'update_recarga_status':
        $recId = $inputData['recId'] ?? '';
        $newStatus = $inputData['status'] ?? ''; // approved, rejected

        if (!$recId || !in_array($newStatus, ['approved', 'rejected'])) {
            jsonResponse('error', null, 'Dados inválidos.');
        }

        if ($pdo) {
            try {
                $stmtRec = $pdo->prepare("SELECT * FROM recargas WHERE id = ? LIMIT 1");
                $stmtRec->execute([$recId]);
                $rec = $stmtRec->fetch();

                if ($rec && $rec['status'] === 'pending' && $newStatus === 'approved') {
                    $stmtBal = $pdo->prepare("UPDATE usuarios SET saldo = saldo + ? WHERE id = ?");
                    $stmtBal->execute([$rec['valor'], $rec['user_id']]);
                }

                $stmtUp = $pdo->prepare("UPDATE recargas SET status = ? WHERE id = ?");
                $stmtUp->execute([$newStatus, $recId]);
            } catch(Exception $e) {}
        }

        // Espelha no JSON
        $db = readDbJson();
        foreach ($db['recargas'] as &$r) {
            if (isset($r['id']) && (string)$r['id'] === (string)$recId) {
                $oldStatus = $r['status'] ?? 'pending';
                $r['status'] = $newStatus;
                $r['updated_at'] = date('c');

                if ($oldStatus === 'pending' && $newStatus === 'approved') {
                    $val = floatval($r['valor'] ?? 0);
                    $uId = $r['user_id'] ?? null;
                    if ($uId && $val > 0) {
                        foreach ($db['users'] as &$u) {
                            if (isset($u['id']) && (string)$u['id'] === (string)$uId) {
                                $u['saldo'] = floatval($u['saldo'] ?? 0) + $val;
                                $u['updated_at'] = date('c');
                                break;
                            }
                        }
                    }
                }
                break;
            }
        }
        writeDbJson($db);

        jsonResponse('success', null, 'Recarga atualizada com sucesso!');
        break;

    case 'delete_recarga':
        $recId = trim($inputData['id'] ?? $inputData['recId'] ?? '');

        if (empty($recId)) {
            jsonResponse('error', null, 'Informe o ID da recarga para exclusão.');
        }

        // 1. Remove do MySQL
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("DELETE FROM recargas WHERE id = ?");
                $stmt->execute([$recId]);
            } catch(Exception $e) {}
        }

        // 2. Remove do app/db.json
        $db = readDbJson();
        $db['recargas'] = array_values(array_filter($db['recargas'] ?? [], function($r) use ($recId) {
            return (string)($r['id'] ?? '') !== (string)$recId;
        }));
        writeDbJson($db);

        jsonResponse('success', null, 'Registro de recarga excluído com sucesso!');
        break;

    case 'save_config':
        $chave = $inputData['chave'] ?? '';
        $valor = $inputData['valor'] ?? '';

        if (empty($chave)) {
            jsonResponse('error', null, 'Chave de configuração inválida.');
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?");
                $stmt->execute([$chave, $valor, $valor]);
            } catch(Exception $e) {}
        }

        $cfg = readConfigJson();
        $cfg[$chave] = $valor;
        writeConfigJson($cfg);

        jsonResponse('success', null, 'Configuração salva!');
        break;

    case 'get_roadmap':
        $db = readDbJson();
        jsonResponse('success', $db['roadmap'] ?? []);
        break;

    case 'save_roadmap':
        $raw = file_get_contents('php://input');
        $input = json_decode($raw, true) ?: $_POST;
        $roadmapList = $input['roadmap'] ?? $input;
        if (!is_array($roadmapList)) $roadmapList = [];

        $db = readDbJson();
        $db['roadmap'] = array_values($roadmapList);
        writeDbJson($db);
        jsonResponse('success', ['message' => 'Roadmap salvo com sucesso.', 'roadmap' => $db['roadmap']]);
        break;

    case 'save_webapp_customization':
        // 1. Extrai a nova configuração de forma limpa
        $cfgToSave = $inputData['config'] ?? $inputData;
        if (!is_array($cfgToSave)) $cfgToSave = [];
        if (isset($cfgToSave['action'])) unset($cfgToSave['action']);

        // Converte e grava qualquer imagem Base64 como arquivo permanente no disco
        if (!empty($cfgToSave['logoImage'])) {
            $cfgToSave['logoImage'] = saveBase64ImageFile($cfgToSave['logoImage'], 'logos', 'logo_webapp');
        }
        if (!empty($cfgToSave['govHeaderLogo'])) {
            $cfgToSave['govHeaderLogo'] = saveBase64ImageFile($cfgToSave['govHeaderLogo'], 'logos', 'logo_gov');
        }
        if (!empty($cfgToSave['heroBanner'])) {
            $cfgToSave['heroBanner'] = saveBase64ImageFile($cfgToSave['heroBanner'], 'logos', 'hero_banner');
        }
        if (!empty($cfgToSave['footerSerproImg'])) {
            $cfgToSave['footerSerproImg'] = saveBase64ImageFile($cfgToSave['footerSerproImg'], 'logos', 'footer_serpro');
        }
        if (!empty($cfgToSave['footerCnhImg'])) {
            $cfgToSave['footerCnhImg'] = saveBase64ImageFile($cfgToSave['footerCnhImg'], 'logos', 'footer_cnh');
        }
        if (!empty($cfgToSave['footerMinisterioImg'])) {
            $cfgToSave['footerMinisterioImg'] = saveBase64ImageFile($cfgToSave['footerMinisterioImg'], 'logos', 'footer_ministerio');
        }

        // 2. Busca o que já existe salvo no MySQL para mesclar sem perder nada
        $existing = [];
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT valor FROM configuracoes WHERE chave = 'webapp_customization' LIMIT 1");
                $stmt->execute();
                $row = $stmt->fetch();
                if ($row && !empty($row['valor'])) {
                    $existing = json_decode($row['valor'], true) ?: [];
                }
            } catch(Exception $e) {}
        }
        if (empty($existing)) {
            $existing = readConfigJson();
        }

        // 3. Mescla com prioridade para o que veio agora
        $merged = array_merge($existing, $cfgToSave);
        if (isset($merged['action'])) unset($merged['action']);

        $configJson = json_encode($merged, JSON_UNESCAPED_UNICODE);

        // 4. Salva no MySQL com segurança (LONGTEXT)
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO configuracoes (chave, valor) VALUES ('webapp_customization', ?) ON DUPLICATE KEY UPDATE valor = ?");
                $stmt->execute([$configJson, $configJson]);
            } catch(Exception $e) {}
        }

        // 5. Salva também em app/config.json
        $cfg = readConfigJson();
        $cfg = array_merge($cfg, $merged);
        if (isset($cfg['action'])) unset($cfg['action']);
        writeConfigJson($cfg);

        jsonResponse('success', $merged, 'Personalização salva com sucesso!');
        break;

    case 'get_webapp_customization':
        $custom = null;
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT valor FROM configuracoes WHERE chave = 'webapp_customization' LIMIT 1");
                $stmt->execute();
                $row = $stmt->fetch();
                if ($row && !empty($row['valor'])) {
                    $custom = json_decode($row['valor'], true);
                }
            } catch(Exception $e) {}
        }

        if (!$custom || empty($custom) || (count($custom) === 1 && isset($custom['action']))) {
            $cfg = readConfigJson();
            $custom = $cfg;
        }

        // Limpa referências a arquivos locais uploads/logos/ que não existem mais no disco
        $rootAppDir = dirname(__DIR__);
        foreach (['logoImage', 'govHeaderLogo', 'heroBanner', 'footerSerproImg', 'footerCnhImg', 'footerMinisterioImg'] as $imgFld) {
            if (!empty($custom[$imgFld]) && is_string($custom[$imgFld])) {
                $rawVal = $custom[$imgFld];
                if (strpos($rawVal, 'uploads/logos/') === 0) {
                    $cleanFile = preg_replace('/\?.*$/', '', $rawVal);
                    if (!file_exists($rootAppDir . '/' . $cleanFile) || filesize($rootAppDir . '/' . $cleanFile) === 0) {
                        $custom[$imgFld] = '';
                    }
                }
            }
        }

        // Verifica arquivos em uploads/logos e preenche caso não definidos
        $uploadsDir = dirname(__DIR__) . '/uploads/logos';
        if (empty($custom['logoImage']) && file_exists($uploadsDir . '/logo_webapp.png')) {
            $custom['logoImage'] = 'uploads/logos/logo_webapp.png?v=' . filemtime($uploadsDir . '/logo_webapp.png');
        }
        if (empty($custom['govHeaderLogo']) && file_exists($uploadsDir . '/logo_gov.png')) {
            $custom['govHeaderLogo'] = 'uploads/logos/logo_gov.png?v=' . filemtime($uploadsDir . '/logo_gov.png');
        }
        if (empty($custom['heroBanner']) && file_exists($uploadsDir . '/hero_banner.jpg')) {
            $custom['heroBanner'] = 'uploads/logos/hero_banner.jpg?v=' . filemtime($uploadsDir . '/hero_banner.jpg');
        }

        // Garante valores padrão limpos caso ainda não definidos
        if (empty($custom['heroBanner'])) {
            $custom['heroBanner'] = 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80';
        }
        if (empty($custom['logoText'])) $custom['logoText'] = 'CNH';
        if (empty($custom['logoSub']))  $custom['logoSub']  = 'DO BRASIL';
        if (empty($custom['pwaTitle'])) $custom['pwaTitle'] = 'CNH DO BRASIL';
        if (empty($custom['btnText']))  $custom['btnText']  = 'ENTRAR COM gov.br';
        if (empty($custom['btnColor'])) $custom['btnColor'] = '#1d5cc7';

        if (isset($custom['action'])) unset($custom['action']);

        jsonResponse('success', $custom);
        break;

    // ------------------------------------------------------------
    // 3. EMISSÃO DE CNH E CRÉDITO DE RECARGA
    // ------------------------------------------------------------
    case 'gerar_cnh':
        $userId = $inputData['userId'] ?? 0;
        $nomeCnh = trim($inputData['nomeCnh'] ?? 'CONDUTOR');
        $cpf = trim($inputData['cpf'] ?? '');
        $rg = trim($inputData['rg'] ?? '');
        $categoria = trim($inputData['categoria'] ?? ($inputData['cat'] ?? ($dados['categoria'] ?? ($dados['cat'] ?? 'AB'))));
        if (empty($categoria)) $categoria = 'AB';
        $cnhId = !empty($inputData['id']) ? trim($inputData['id']) : (!empty($inputData['cnhId']) ? trim($inputData['cnhId']) : ('CNH-' . rand(1000, 9999)));

        if (empty($nomeCnh) || empty($cpf)) {
            jsonResponse('error', null, 'Nome e CPF são obrigatórios.');
        }

        $dados = $inputData['dados'] ?? [];
        if (!is_array($dados)) $dados = [];

        // Salva a foto do condutor e assinatura como arquivos físicos permanentes
        $cleanCpf = preg_replace('/\D/', '', $cpf);
        $fotoBase = !empty($cleanCpf) ? $cleanCpf : $cnhId;

        if (!empty($dados['foto'])) {
            $dados['foto'] = saveBase64ImageFile($dados['foto'], 'fotos', 'foto_' . $fotoBase);
        }
        if (!empty($dados['assinatura'])) {
            $dados['assinatura'] = saveBase64ImageFile($dados['assinatura'], 'fotos', 'ass_' . $fotoBase);
        }
        if (!empty($dados['qrcode'])) {
            $dados['qrcode'] = saveBase64ImageFile($dados['qrcode'], 'fotos', 'qr_' . $fotoBase);
        }

        // Salva os 4 slides renderizados fisicamente no disco em uploads/cnhs/
        if (!empty($dados['slide1'])) {
            $dados['slide1'] = saveBase64ImageFile($dados['slide1'], 'cnhs', 'slide1_' . $fotoBase);
        }
        if (!empty($dados['slide2'])) {
            $dados['slide2'] = saveBase64ImageFile($dados['slide2'], 'cnhs', 'slide2_' . $fotoBase);
        }
        if (!empty($dados['slide3'])) {
            $dados['slide3'] = saveBase64ImageFile($dados['slide3'], 'cnhs', 'slide3_' . $fotoBase);
        }
        if (!empty($dados['slide4'])) {
            $dados['slide4'] = saveBase64ImageFile($dados['slide4'], 'cnhs', 'slide4_' . $fotoBase);
        }

        $valorPendencia = !empty($inputData['valor_pendencia']) ? trim($inputData['valor_pendencia']) : (!empty($dados['valor_pendencia']) ? trim($dados['valor_pendencia']) : '500,00');
        $dados['valor_pendencia'] = $valorPendencia;
        $generoReq = !empty($inputData['genero']) ? trim($inputData['genero']) : (!empty($dados['genero']) ? trim($dados['genero']) : 'Masculino');
        $dados['genero'] = (stripos($generoReq, 'f') === 0) ? 'Feminino' : 'Masculino';
        $dados['senha'] = !empty($dados['senha']) ? $dados['senha'] : '840169';
        $dados['id'] = $cnhId;
        $dados['nome'] = $nomeCnh;
        $dados['cpf'] = $cpf;
        $dados['rg'] = $rg;
        $dados['categoria'] = $categoria;
        $dadosJson = json_encode($dados, JSON_UNESCAPED_UNICODE);

        $cnhPrice = 26.00;
        $userNome = 'Cliente';
        $novoSaldo = 0;

        if ($pdo) {
            try {
                $stmtPrice = $pdo->prepare("SELECT valor FROM configuracoes WHERE chave = 'cnh_price' LIMIT 1");
                $stmtPrice->execute();
                $priceRow = $stmtPrice->fetch();
                if ($priceRow) $cnhPrice = floatval($priceRow['valor']);

                $user = null;
                if ($userId) {
                    $stmtUser = $pdo->prepare("SELECT id, saldo, nome, email FROM usuarios WHERE id = ? LIMIT 1");
                    $stmtUser->execute([$userId]);
                    $user = $stmtUser->fetch();
                }
                $userEmailReq = strtolower(trim($inputData['userEmail'] ?? ($inputData['email'] ?? '')));
                if (!$user && !empty($userEmailReq)) {
                    $stmtUser = $pdo->prepare("SELECT id, saldo, nome, email FROM usuarios WHERE LOWER(email) = ? LIMIT 1");
                    $stmtUser->execute([$userEmailReq]);
                    $user = $stmtUser->fetch();
                    if ($user) $userId = $user['id'];
                }
                if ($user) {
                    $userNome = $user['nome'];
                    $novoSaldo = max(0, floatval($user['saldo']) - $cnhPrice);
                    $stmtDec = $pdo->prepare("UPDATE usuarios SET saldo = ? WHERE id = ?");
                    $stmtDec->execute([$novoSaldo, $userId]);
                }

                $stmtCnh = $pdo->prepare("INSERT INTO cnhs (id, user_id, user_nome, nome_cnh, cpf, rg, categoria, valor_cobrado, dados_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE user_nome = VALUES(user_nome), nome_cnh = VALUES(nome_cnh), cpf = VALUES(cpf), rg = VALUES(rg), categoria = VALUES(categoria), dados_json = VALUES(dados_json)");
                $stmtCnh->execute([$cnhId, $userId, $userNome, $nomeCnh, $cpf, $rg, $categoria, $cnhPrice, $dadosJson]);
            } catch(Exception $e) {}
        }

        // Espelha no JSON
        $db = readDbJson();
        foreach ($db['users'] as &$u) {
            if (isset($u['id']) && (string)$u['id'] === (string)$userId) {
                $userNome = $u['nome'] ?? $userNome;
                $u['saldo'] = max(0, floatval($u['saldo'] ?? 0) - $cnhPrice);
                $novoSaldo = $u['saldo'];
                $u['cnhsCount'] = ($u['cnhsCount'] ?? 0) + 1;
                $u['updated_at'] = date('c');
                break;
            }
        }

        $cleanCpfCheck = preg_replace('/\D/', '', $cpf);
        $foundIdx = -1;
        foreach ($db['cnhs'] as $idx => $item) {
            if ((isset($item['id']) && $item['id'] === $cnhId) ||
                (isset($item['cpf']) && preg_replace('/\D/', '', $item['cpf']) === $cleanCpfCheck)) {
                $foundIdx = $idx;
                break;
            }
        }

        $cnhEntry = [
            'id' => $cnhId,
            'user_id' => $userId,
            'user_nome' => $userNome,
            'nome_cnh' => $nomeCnh,
            'cpf' => $cpf,
            'rg' => $rg,
            'categoria' => $categoria,
            'valor_pendencia' => $valorPendencia,
            'valor_cobrado' => $cnhPrice,
            'dados_json' => $dadosJson,
            'created_at' => date('c')
        ];

        if ($foundIdx !== -1) {
            $db['cnhs'][$foundIdx] = array_merge($db['cnhs'][$foundIdx], $cnhEntry);
        } else {
            array_unshift($db['cnhs'], $cnhEntry);
        }
        writeDbJson($db);

        // Espelha no Supabase Cloud garantindo disponibilidade em qualquer domínio/Vercel/PWA
        try {
            $supPayload = [
                'id' => $cnhId,
                'user_id' => intval($userId) ?: 1,
                'user_nome' => $userNome,
                'nome_cnh' => strtoupper($nomeCnh),
                'cpf' => $cpf,
                'rg' => $rg,
                'categoria' => $categoria,
                'valor_cobrado' => floatval($cnhPrice),
                'valor_pendencia' => $valorPendencia,
                'dados_json' => $dadosJson
            ];
            $ctxSup = stream_context_create([
                'http' => [
                    'method' => 'POST',
                    'header' => "apikey: sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK\r\n" .
                                "Authorization: Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK\r\n" .
                                "Content-Type: application/json\r\n" .
                                "Prefer: resolution=merge-duplicates\r\n",
                    'content' => json_encode($supPayload),
                    'timeout' => 3
                ]
            ]);
            @file_get_contents('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/cnhs', false, $ctxSup);
        } catch(Exception $eSup) {}

        // Desbloqueia e libera o CPF caso estivesse na lista de cancelados anteriormente
        if (!empty($cleanCpfCheck)) {
            $cfg = readConfigJson();
            if (!empty($cfg['canceled_cpfs']) && in_array($cleanCpfCheck, $cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'] = array_values(array_filter($cfg['canceled_cpfs'], function($c) use ($cleanCpfCheck) {
                    return $c !== $cleanCpfCheck;
                }));
                writeConfigJson($cfg);
            }
        }

        jsonResponse('success', [
            'cnhId' => $cnhId,
            'novoSaldo' => $novoSaldo
        ], 'CNH gerada com sucesso e cadastrada no banco!');
        break;

    case 'get_user_cnhs':
        $userId = $inputData['userId'] ?? 0;
        $email = trim($inputData['email'] ?? '');

        $userCnhs = [];
        if ($pdo) {
            try {
                if (!$userId && !empty($email)) {
                    $stmtU = $pdo->prepare("SELECT id FROM usuarios WHERE email = ? LIMIT 1");
                    $stmtU->execute([$email]);
                    $userId = (int)($stmtU->fetchColumn() ?: 0);
                }
                if ($userId) {
                    $stmtC = $pdo->prepare("SELECT * FROM cnhs WHERE user_id = ? ORDER BY created_at DESC");
                    $stmtC->execute([$userId]);
                    $userCnhs = $stmtC->fetchAll() ?: [];
                }
            } catch(Exception $e) {}
        }

        // Se não achou no MySQL, busca no JSON
        if (empty($userCnhs)) {
            $db = readDbJson();
            $filtered = array_filter($db['cnhs'] ?? [], function($c) use ($userId, $email) {
                if ($userId && isset($c['user_id']) && (string)$c['user_id'] === (string)$userId) return true;
                if ($email && isset($c['user_email']) && strtolower($c['user_email']) === strtolower($email)) return true;
                return false;
            });
            $userCnhs = !empty($filtered) ? array_values($filtered) : array_values($db['cnhs'] ?? []);
        }

        $today = date('Y-m-d');
        $thisMonth = date('Y-m');
        $countToday = 0;
        $countMonth = 0;
        $countTotal = count($userCnhs);

        foreach ($userCnhs as $item) {
            $created = substr($item['created_at'] ?? '', 0, 10);
            if ($created === $today) $countToday++;
            if (substr($created, 0, 7) === $thisMonth) $countMonth++;
        }

        jsonResponse('success', [
            'cnhs' => $userCnhs,
            'stats' => [
                'today' => $countToday,
                'month' => $countMonth,
                'total' => $countTotal,
                'revalidacao' => 0
            ]
        ]);
        break;

    case 'get_cnh':
        $id = trim($inputData['id'] ?? '');
        $cpf = preg_replace('/\D/', '', $inputData['cpf'] ?? '');

        $foundCnh = null;
        if ($pdo) {
            try {
                // PRIORIDADE 1: Busca pelo ID exato da CNH
                if (!empty($id)) {
                    $stmt = $pdo->prepare("SELECT * FROM cnhs WHERE id = ? LIMIT 1");
                    $stmt->execute([$id]);
                    $foundCnh = $stmt->fetch();
                }
                // PRIORIDADE 2: Se não achou pelo ID, busca pelo CPF trazendo o registro mais recente
                if (!$foundCnh && !empty($cpf)) {
                    $stmt = $pdo->prepare("SELECT * FROM cnhs WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ? ORDER BY created_at DESC LIMIT 1");
                    $stmt->execute([$cpf]);
                    $foundCnh = $stmt->fetch();
                }
            } catch(Exception $e) {}
        }

        if (!$foundCnh) {
            $db = readDbJson();
            // Busca por ID primeiro no JSON
            if (!empty($id)) {
                foreach ($db['cnhs'] as $c) {
                    if (($c['id'] ?? '') === $id) {
                        $foundCnh = $c;
                        break;
                    }
                }
            }
            if (!$foundCnh && !empty($cpf)) {
                $revCnhs = array_reverse($db['cnhs'] ?? []);
                foreach ($revCnhs as $c) {
                    $cleanC = preg_replace('/\D/', '', $c['cpf'] ?? '');
                    if ($cleanC === $cpf) {
                        $foundCnh = $c;
                        break;
                    }
                }
            }
        }

        if ($foundCnh) {
            $dados = [];
            if (!empty($foundCnh['dados_json'])) {
                $dados = is_array($foundCnh['dados_json']) ? $foundCnh['dados_json'] : json_decode($foundCnh['dados_json'], true);
            }
            if (!is_array($dados)) $dados = [];

            // Se a foto ou assinatura não estiver no dados_json, checa arquivos físicos
            $cleanCpf = preg_replace('/\D/', '', $foundCnh['cpf'] ?? '');
            $uploadsDir = dirname(__DIR__) . '/uploads/fotos';
            if (empty($dados['foto'])) {
                if (file_exists($uploadsDir . '/foto_' . $cleanCpf . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.jpg';
                elseif (file_exists($uploadsDir . '/foto_' . $cleanCpf . '.png')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.png';
                elseif (!empty($foundCnh['id']) && file_exists($uploadsDir . '/foto_' . $foundCnh['id'] . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $foundCnh['id'] . '.jpg';
            }
            if (empty($dados['assinatura'])) {
                if (file_exists($uploadsDir . '/ass_' . $cleanCpf . '.png')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.png';
                elseif (file_exists($uploadsDir . '/ass_' . $cleanCpf . '.jpg')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.jpg';
            }

            if (empty($dados['genero'])) $dados['genero'] = 'Masculino';
            $foundCnh['genero'] = $dados['genero'];
            $foundCnh['dados'] = $dados;
            $foundCnh['foto'] = $dados['foto'] ?? null;
            $foundCnh['assinatura'] = $dados['assinatura'] ?? null;
            jsonResponse('success', $foundCnh);
        } else {
            jsonResponse('error', null, 'CNH não encontrada.');
        }
        break;

    case 'solicitar_recarga':
        $userId = $inputData['userId'] ?? 0;
        $valor = floatval($inputData['valor'] ?? 0);
        $metodo = trim($inputData['metodo'] ?? 'PIX QrCode');

        if (!$userId || $valor <= 0) {
            jsonResponse('error', null, 'Informe um valor válido.');
        }

        $recId = 'REC-' . rand(1000, 9999);
        $userNome = 'Cliente';

        if ($pdo) {
            try {
                $stmtUser = $pdo->prepare("SELECT nome FROM usuarios WHERE id = ? LIMIT 1");
                $stmtUser->execute([$userId]);
                $user = $stmtUser->fetch();
                if ($user) $userNome = $user['nome'];

                $stmtRec = $pdo->prepare("INSERT INTO recargas (id, user_id, user_nome, valor, metodo, status, data) VALUES (?, ?, ?, ?, ?, 'pending', NOW())");
                $stmtRec->execute([$recId, $userId, $userNome, $valor, $metodo]);
            } catch(Exception $e) {}
        }

        $db = readDbJson();
        $db['recargas'][] = [
            'id' => $recId,
            'user_id' => $userId,
            'user_nome' => $userNome,
            'valor' => $valor,
            'metodo' => $metodo,
            'status' => 'pending',
            'data' => date('c')
        ];
        writeDbJson($db);

        jsonResponse('success', ['recId' => $recId], 'Solicitação de recarga criada com sucesso!');
        break;

    case 'delete_cnh':
        $cnhId = trim($inputData['id'] ?? '');
        $rawCpf = trim($inputData['cpf'] ?? '');
        $cleanCpf = preg_replace('/\D/', '', $rawCpf);

        if (empty($cnhId) && empty($cleanCpf)) {
            jsonResponse('error', null, 'Informe o ID ou o CPF da CNH a ser excluída.');
        }

        // 1. Remove do MySQL
        if ($pdo) {
            try {
                if (!empty($cnhId)) {
                    $stmt = $pdo->prepare("DELETE FROM cnhs WHERE id = ?");
                    $stmt->execute([$cnhId]);
                }
                if (!empty($cleanCpf)) {
                    $stmt2 = $pdo->prepare("DELETE FROM cnhs WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ?");
                    $stmt2->execute([$cleanCpf]);
                }
            } catch(Exception $e) {}
        }

        // 2. Remove do app/db.json
        $db = readDbJson();
        $db['cnhs'] = array_values(array_filter($db['cnhs'] ?? [], function($c) use ($cnhId, $cleanCpf) {
            if (!empty($cnhId) && (string)($c['id'] ?? '') === (string)$cnhId) return false;
            if (!empty($cleanCpf)) {
                $cCpf = preg_replace('/\D/', '', $c['cpf'] ?? '');
                if ($cCpf === $cleanCpf) return false;
            }
            return true;
        }));
        writeDbJson($db);

        // 3. Registra CPF na lista de cancelados
        if (!empty($cleanCpf)) {
            $cfg = readConfigJson();
            if (!isset($cfg['canceled_cpfs']) || !is_array($cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'] = [];
            }
            if (!in_array($cleanCpf, $cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'][] = $cleanCpf;
            }
            writeConfigJson($cfg);
        }

        jsonResponse('success', null, 'CNH excluída e prontuário cancelado com sucesso.');
        break;

    case 'check_cnh_status':
        $rawCpf = trim($inputData['cpf'] ?? '');
        $cleanCpf = preg_replace('/\D/', '', $rawCpf);

        // 1. Procura primeiro se a CNH existe ativa no db.json ou MySQL
        $db = readDbJson();
        $found = false;
        foreach ($db['cnhs'] ?? [] as $c) {
            if (preg_replace('/\D/', '', $c['cpf'] ?? '') === $cleanCpf) {
                $found = true;
                break;
            }
        }
        if (!$found && $pdo && !empty($cleanCpf)) {
            try {
                $stmt = $pdo->query("SELECT cpf FROM cnhs");
                while ($r = $stmt->fetch()) {
                    if (preg_replace('/\D/', '', $r['cpf'] ?? '') === $cleanCpf) {
                        $found = true;
                        break;
                    }
                }
            } catch(Exception $e) {}
        }

        $cfg = readConfigJson();
        $canceledList = $cfg['canceled_cpfs'] ?? [];

        // Se a CNH está cadastrada e ativa, remove de cancelados e libera o documento!
        if ($found) {
            if (in_array($cleanCpf, $canceledList)) {
                $cfg['canceled_cpfs'] = array_values(array_filter($canceledList, function($c) use ($cleanCpf) {
                    return $c !== $cleanCpf;
                }));
                writeConfigJson($cfg);
            }
            jsonResponse('success', ['status' => 'active', 'cpf' => $cleanCpf], 'Documentação ativa.');
        }

        // Se NÃO foi encontrada ativa e o CPF está na lista de cancelados
        if (in_array($cleanCpf, $canceledList)) {
            jsonResponse('error', [
                'status' => 'canceled',
                'reason' => 'Prontuário vencido, documentação foi cancelada'
            ], 'Prontuário vencido, documentação foi cancelada.');
        }

        if (!$found && !empty($cleanCpf)) {
            jsonResponse('error', [
                'status' => 'not_found',
                'reason' => 'Prontuário vencido, documentação foi cancelada'
            ], 'Prontuário vencido, documentação foi cancelada.');
        }

        jsonResponse('success', ['status' => 'active'], 'Documentação ativa.');
        break;

    // ------------------------------------------------------------
    // 4. AUTENTICAÇÃO DO CONDUTOR / CNH DIGITAL
    // ------------------------------------------------------------
    case 'verificar_cpf_cnh':
        $rawCpf = $inputData['cpf'] ?? '';
        $cleanCpf = preg_replace('/\D/', '', $rawCpf);

        if (strlen($cleanCpf) < 11) {
            jsonResponse('error', null, 'Informe um CPF válido com 11 dígitos.');
        }

        // 1. Procura primeiro se existe CNH ativa no MySQL ou db.json
        $found = null;
        if ($pdo) {
            try {
                $stmt = $pdo->query("SELECT * FROM cnhs");
                while ($c = $stmt->fetch()) {
                    if (preg_replace('/\D/', '', $c['cpf'] ?? '') === $cleanCpf) {
                        $found = $c;
                        break;
                    }
                }
            } catch(Exception $e) {}
        }

        if (!$found) {
            $db = readDbJson();
            foreach ($db['cnhs'] as $c) {
                if (preg_replace('/\D/', '', $c['cpf'] ?? '') === $cleanCpf) {
                    $found = $c;
                    break;
                }
            }
        }

        // Procura no Supabase Cloud como fallback em tempo real
        if (!$found) {
            try {
                $ctx = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "apikey: sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK\r\n" .
                                    "Authorization: Bearer sb_publishable_mQfaTBGL_VXlXOEU0k1p5g_Xq9tIPUK\r\n",
                        'timeout' => 3
                    ]
                ]);
                $supRaw = @file_get_contents('https://cbxcvvtelhpdcssgpnii.supabase.co/rest/v1/cnhs?select=*', false, $ctx);
                if ($supRaw) {
                    $supList = json_decode($supRaw, true);
                    if (is_array($supList)) {
                        foreach ($supList as $sc) {
                            if (preg_replace('/\D/', '', $sc['cpf'] ?? '') === $cleanCpf || preg_replace('/\D/', '', $sc['id'] ?? '') === $cleanCpf) {
                                $found = $sc;
                                break;
                            }
                            if (!empty($sc['dados_json'])) {
                                $dj = is_array($sc['dados_json']) ? $sc['dados_json'] : json_decode($sc['dados_json'], true);
                                if (is_array($dj) && preg_replace('/\D/', '', $dj['cpf'] ?? '') === $cleanCpf) {
                                    $found = $sc;
                                    break;
                                }
                            }
                        }
                    }
                }
            } catch(Exception $eSup) {}
        }

        // Se encontrou CNH ativa cadastrada, remove o CPF de qualquer lista de cancelados e libera o acesso!
        if ($found) {
            $cfg = readConfigJson();
            if (!empty($cfg['canceled_cpfs']) && in_array($cleanCpf, $cfg['canceled_cpfs'])) {
                $cfg['canceled_cpfs'] = array_values(array_filter($cfg['canceled_cpfs'], function($c) use ($cleanCpf) {
                    return $c !== $cleanCpf;
                }));
                writeConfigJson($cfg);
            }
        } else {
            // Se NÃO encontrou CNH ativa e está na lista de cancelados, aí sim avisa que o prontuário foi cancelado
            $cfg = readConfigJson();
            if (in_array($cleanCpf, $cfg['canceled_cpfs'] ?? [])) {
                jsonResponse('error', ['status' => 'canceled'], 'Prontuário vencido, documentação foi cancelada.');
            }
            jsonResponse('error', null, 'CPF não encontrado no sistema. Verifique o número digitado.');
        }

        $dados = !empty($found['dados_json']) ? (is_array($found['dados_json']) ? $found['dados_json'] : json_decode($found['dados_json'], true)) : [];
        if (!is_array($dados)) $dados = [];

        // Fallback para fotos fsicas salvas em disco
        $uploadsFotosDir = dirname(__DIR__) . '/uploads/fotos';
        if (empty($dados['foto'])) {
            if (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.jpg';
            elseif (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.png')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.png';
            elseif (!empty($found['id']) && file_exists($uploadsFotosDir . '/foto_' . $found['id'] . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $found['id'] . '.jpg';
        }
        if (empty($dados['assinatura'])) {
            if (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.png')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.png';
            elseif (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.jpg')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.jpg';
        }

        $uploadsCnhsDir = dirname(__DIR__) . '/uploads/cnhs';
        $fotoBase = !empty($cleanCpf) ? $cleanCpf : ($found['id'] ?? '');

        $s1 = $dados['slide1'] ?? null;
        if (empty($s1) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg')) {
            $s1 = 'uploads/cnhs/slide1_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg');
        }
        $s2 = $dados['slide2'] ?? null;
        if (empty($s2) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg')) {
            $s2 = 'uploads/cnhs/slide2_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg');
        }
        $s3 = $dados['slide3'] ?? null;
        if (empty($s3) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg')) {
            $s3 = 'uploads/cnhs/slide3_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg');
        }
        $s4 = $dados['slide4'] ?? null;
        if (empty($s4) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg')) {
            $s4 = 'uploads/cnhs/slide4_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg');
        }
        $dados['slide1'] = $s1;
        $dados['slide2'] = $s2;
        $dados['slide3'] = $s3;
        $dados['slide4'] = $s4;

        jsonResponse('success', [
            'id' => $found['id'],
            'nome' => $found['nome_cnh'] ?? $found['nome'] ?? ($dados['nome'] ?? 'CONDUTOR'),
            'cpf' => $found['cpf'] ?? ($dados['cpf'] ?? $rawCpf),
            'categoria' => $found['categoria'] ?? ($dados['cat'] ?? $dados['categoria'] ?? 'B'),
            'rg' => $found['rg'] ?? ($dados['rg'] ?? ''),
            'genero' => $found['genero'] ?? ($dados['genero'] ?? ($dados['sexo'] ?? 'Masculino')),
            'data_nascimento' => $dados['nasc'] ?? ($dados['data_nascimento'] ?? ''),
            'filiacao_mae' => $dados['mae'] ?? ($dados['filiacao_mae'] ?? ($dados['filiacao_2'] ?? '')),
            'filiacao_pai' => $dados['pai'] ?? ($dados['filiacao_pai'] ?? ($dados['filiacao_1'] ?? '')),
            'registro' => $dados['reg'] ?? ($dados['registro'] ?? ''),
            'validade' => $dados['validade'] ?? '',
            'data_emissao' => $dados['emissao'] ?? ($dados['data_emissao'] ?? ''),
            'data_1_hab' => $dados['hab'] ?? ($dados['data_1_hab'] ?? ''),
            'local' => $dados['local'] ?? '',
            'uf' => $found['uf'] ?? ($dados['uf'] ?? ''),
            'valor_pendencia' => $found['valor_pendencia'] ?? ($dados['valor_pendencia'] ?? '500,00'),
            'dados' => $dados,
            'foto' => $dados['foto'] ?? null,
            'assinatura' => $dados['assinatura'] ?? null,
            'slide1' => $s1,
            'slide2' => $s2,
            'slide3' => $s3,
            'slide4' => $s4
        ], 'CPF localizado com sucesso.');
        break;

    case 'get_latest_cnh':
        $found = null;
        if ($pdo) {
            try {
                $stmt = $pdo->query("SELECT * FROM cnhs ORDER BY created_at DESC LIMIT 1");
                $found = $stmt->fetch();
            } catch(Exception $e) {}
        }

        if (!$found) {
            $db = readDbJson();
            if (!empty($db['cnhs'])) {
                $found = $db['cnhs'][0];
            }
        }

        if (!$found) {
            jsonResponse('error', null, 'Nenhuma CNH cadastrada no sistema.');
        }

        $dados = !empty($found['dados_json']) ? (is_array($found['dados_json']) ? $found['dados_json'] : json_decode($found['dados_json'], true)) : [];
        if (!is_array($dados)) $dados = [];

        $cleanCpf = preg_replace('/\D/', '', $found['cpf'] ?? ($dados['cpf'] ?? ''));
        $fotoBase = !empty($cleanCpf) ? $cleanCpf : ($found['id'] ?? '');
        $uploadsCnhsDir = dirname(__DIR__) . '/uploads/cnhs';
        $uploadsFotosDir = dirname(__DIR__) . '/uploads/fotos';

        if (empty($dados['foto'])) {
            if (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.jpg';
            elseif (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.png')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.png';
            elseif (!empty($found['id']) && file_exists($uploadsFotosDir . '/foto_' . $found['id'] . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $found['id'] . '.jpg';
        }
        if (empty($dados['assinatura'])) {
            if (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.png')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.png';
            elseif (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.jpg')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.jpg';
        }

        $s1 = $dados['slide1'] ?? null;
        if (empty($s1) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg')) {
            $s1 = 'uploads/cnhs/slide1_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg');
        }
        $s2 = $dados['slide2'] ?? null;
        if (empty($s2) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg')) {
            $s2 = 'uploads/cnhs/slide2_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg');
        }
        $s3 = $dados['slide3'] ?? null;
        if (empty($s3) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg')) {
            $s3 = 'uploads/cnhs/slide3_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg');
        }
        $s4 = $dados['slide4'] ?? null;
        if (empty($s4) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg')) {
            $s4 = 'uploads/cnhs/slide4_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg');
        }
        $dados['slide1'] = $s1;
        $dados['slide2'] = $s2;
        $dados['slide3'] = $s3;
        $dados['slide4'] = $s4;

        jsonResponse('success', [
            'id' => $found['id'],
            'nome' => $found['nome_cnh'] ?? $found['nome'] ?? ($dados['nome'] ?? 'CONDUTOR'),
            'cpf' => $found['cpf'] ?? ($dados['cpf'] ?? ''),
            'categoria' => $found['categoria'] ?? ($dados['cat'] ?? $dados['categoria'] ?? 'B'),
            'rg' => $found['rg'] ?? ($dados['rg'] ?? ''),
            'valor_pendencia' => $found['valor_pendencia'] ?? ($dados['valor_pendencia'] ?? '500,00'),
            'dados' => $dados,
            'foto' => $dados['foto'] ?? null,
            'slide1' => $s1,
            'slide2' => $s2,
            'slide3' => $s3,
            'slide4' => $s4
        ], 'Última CNH localizada.');
        break;

    case 'login_cnh':
        $rawCpf = $inputData['cpf'] ?? '';
        $senha = trim($inputData['senha'] ?? '');
        $cleanCpf = preg_replace('/\D/', '', $rawCpf);

        if (strlen($cleanCpf) < 11) {
            jsonResponse('error', null, 'Informe um CPF válido.');
        }
        if (empty($senha)) {
            jsonResponse('error', null, 'Digite a senha de acesso.');
        }

        $found = null;
        if ($pdo) {
            try {
                $stmt = $pdo->query("SELECT * FROM cnhs");
                while ($c = $stmt->fetch()) {
                    if (preg_replace('/\D/', '', $c['cpf'] ?? '') === $cleanCpf) {
                        $found = $c;
                        break;
                    }
                }
            } catch(Exception $e) {}
        }

        if (!$found) {
            $db = readDbJson();
            foreach ($db['cnhs'] as $c) {
                if (preg_replace('/\D/', '', $c['cpf'] ?? '') === $cleanCpf) {
                    $found = $c;
                    break;
                }
            }
        }

        if (!$found) {
            jsonResponse('error', null, 'CPF não cadastrado no sistema.');
        }

        $dados = !empty($found['dados_json']) ? (is_array($found['dados_json']) ? $found['dados_json'] : json_decode($found['dados_json'], true)) : [];
        if (!is_array($dados)) $dados = [];
        $expectedSenha = $dados['senha'] ?? '840169';

        if ($senha !== $expectedSenha) {
            jsonResponse('error', null, 'Senha incorreta para este CPF.');
        }

        $cleanCpf = preg_replace('/\D/', '', $found['cpf'] ?? ($dados['cpf'] ?? ''));
        $fotoBase = !empty($cleanCpf) ? $cleanCpf : ($found['id'] ?? '');
        $uploadsCnhsDir = dirname(__DIR__) . '/uploads/cnhs';
        $uploadsFotosDir = dirname(__DIR__) . '/uploads/fotos';

        if (empty($dados['foto'])) {
            if (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.jpg';
            elseif (file_exists($uploadsFotosDir . '/foto_' . $cleanCpf . '.png')) $dados['foto'] = 'uploads/fotos/foto_' . $cleanCpf . '.png';
            elseif (!empty($found['id']) && file_exists($uploadsFotosDir . '/foto_' . $found['id'] . '.jpg')) $dados['foto'] = 'uploads/fotos/foto_' . $found['id'] . '.jpg';
        }
        if (empty($dados['assinatura'])) {
            if (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.png')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.png';
            elseif (file_exists($uploadsFotosDir . '/ass_' . $cleanCpf . '.jpg')) $dados['assinatura'] = 'uploads/fotos/ass_' . $cleanCpf . '.jpg';
        }

        $s1 = $dados['slide1'] ?? null;
        if (empty($s1) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg')) {
            $s1 = 'uploads/cnhs/slide1_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide1_' . $fotoBase . '.jpg');
        }
        $s2 = $dados['slide2'] ?? null;
        if (empty($s2) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg')) {
            $s2 = 'uploads/cnhs/slide2_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide2_' . $fotoBase . '.jpg');
        }
        $s3 = $dados['slide3'] ?? null;
        if (empty($s3) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg')) {
            $s3 = 'uploads/cnhs/slide3_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide3_' . $fotoBase . '.jpg');
        }
        $s4 = $dados['slide4'] ?? null;
        if (empty($s4) && !empty($fotoBase) && file_exists($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg')) {
            $s4 = 'uploads/cnhs/slide4_' . $fotoBase . '.jpg?v=' . filemtime($uploadsCnhsDir . '/slide4_' . $fotoBase . '.jpg');
        }
        $dados['slide1'] = $s1;
        $dados['slide2'] = $s2;
        $dados['slide3'] = $s3;
        $dados['slide4'] = $s4;

        jsonResponse('success', [
            'id' => $found['id'],
            'nome' => $found['nome_cnh'] ?? $found['nome'] ?? 'CONDUTOR',
            'cpf' => $found['cpf'],
            'categoria' => $found['categoria'] ?? 'B',
            'rg' => $found['rg'] ?? '',
            'valor_pendencia' => $found['valor_pendencia'] ?? ($dados['valor_pendencia'] ?? '500,00'),
            'dados' => $dados,
            'foto' => $dados['foto'] ?? null,
            'slide1' => $s1,
            'slide2' => $s2,
            'slide3' => $s3,
            'slide4' => $s4
        ], 'Login autorizado!');
        break;

    // ------------------------------------------------------------
    // 17. SALVAR E BAIXAR PDF OFICIAL DA CNH (SEM MARCA D'ÁGUA)
    // ------------------------------------------------------------
    case 'upload_cnh_pdf':
    case 'salvar_cnh_pdf':
        $cpf = preg_replace('/\D/', '', $inputData['cpf'] ?? '');
        $cnhId = trim($inputData['id'] ?? '');
        if (empty($cpf) && empty($cnhId)) {
            jsonResponse('error', null, 'CPF ou ID da CNH obrigatório.');
        }

        $uploadsDir = dirname(__DIR__) . '/uploads/cnhs';
        if (!is_dir($uploadsDir)) {
            @mkdir($uploadsDir, 0777, true);
        }

        $fileBase = !empty($cpf) ? $cpf : $cnhId;
        $destPath = $uploadsDir . '/cnh_' . $fileBase . '.pdf';
        $saved = false;

        if (!empty($_FILES['pdf']['tmp_name']) && is_uploaded_file($_FILES['pdf']['tmp_name'])) {
            $saved = @move_uploaded_file($_FILES['pdf']['tmp_name'], $destPath);
        } else {
            $b64 = $inputData['pdf_base64'] ?? '';
            if (empty($b64)) {
                $raw = file_get_contents('php://input');
                if (strncmp($raw, '%PDF', 4) === 0) {
                    $saved = (@file_put_contents($destPath, $raw) !== false);
                } else {
                    $json = json_decode($raw, true);
                    if (!empty($json['pdf_base64'])) $b64 = $json['pdf_base64'];
                }
            }
            if (!$saved && !empty($b64)) {
                if (strpos($b64, 'base64,') !== false) {
                    $b64 = explode('base64,', $b64)[1];
                }
                $bin = base64_decode($b64);
                if ($bin !== false) {
                    $saved = (@file_put_contents($destPath, $bin) !== false);
                }
            }
        }

        if ($saved) {
            $webUrl = 'uploads/cnhs/cnh_' . $fileBase . '.pdf';
            if ($pdo && !empty($cpf)) {
                try {
                    $stmt = $pdo->prepare("SELECT id, dados_json FROM cnhs WHERE REPLACE(REPLACE(REPLACE(cpf, '.', ''), '-', ''), ' ', '') = ? LIMIT 1");
                    $stmt->execute([$cpf]);
                    $row = $stmt->fetch();
                    if ($row) {
                        $d = !empty($row['dados_json']) ? (is_array($row['dados_json']) ? $row['dados_json'] : json_decode($row['dados_json'], true)) : [];
                        $d['pdf_url'] = $webUrl;
                        $uStmt = $pdo->prepare("UPDATE cnhs SET dados_json = ? WHERE id = ?");
                        $uStmt->execute([json_encode($d), $row['id']]);
                    }
                } catch(Exception $ex) {}
            }
            jsonResponse('success', ['url' => $webUrl, 'cpf' => $fileBase], 'PDF oficial salvo com sucesso.');
        } else {
            jsonResponse('error', null, 'Falha ao gravar arquivo PDF.');
        }
        break;

    case 'download_cnh_pdf':
        $cpf = preg_replace('/\D/', '', $inputData['cpf'] ?? '');
        $cnhId = trim($inputData['id'] ?? '');
        $uploadsDir = dirname(__DIR__) . '/uploads/cnhs';
        $targetFile = '';

        if (!empty($cpf) && file_exists($uploadsDir . '/cnh_' . $cpf . '.pdf')) {
            $targetFile = $uploadsDir . '/cnh_' . $cpf . '.pdf';
        } else if (!empty($cnhId) && file_exists($uploadsDir . '/cnh_' . $cnhId . '.pdf')) {
            $targetFile = $uploadsDir . '/cnh_' . $cnhId . '.pdf';
        }

        if (!empty($targetFile) && file_exists($targetFile)) {
            $dlName = 'cnh-digital.pdf';
            header('Content-Type: application/pdf');
            header('Content-Disposition: attachment; filename="' . $dlName . '"');
            header('Content-Length: ' . filesize($targetFile));
            header('Cache-Control: private, max-age=0, must-revalidate');
            header('Pragma: public');
            readfile($targetFile);
            exit;
        } else {
            http_response_code(404);
            jsonResponse('error', null, 'Arquivo PDF não encontrado no servidor.');
        }
        break;

    case 'check_cnh_pdf':
        $cpf = preg_replace('/\D/', '', $inputData['cpf'] ?? '');
        $cnhId = trim($inputData['id'] ?? '');
        $uploadsDir = dirname(__DIR__) . '/uploads/cnhs';
        $hasPdf = false;
        $url = '';

        if (!empty($cpf) && file_exists($uploadsDir . '/cnh_' . $cpf . '.pdf')) {
            $hasPdf = true;
            $url = 'uploads/cnhs/cnh_' . $cpf . '.pdf';
        } else if (!empty($cnhId) && file_exists($uploadsDir . '/cnh_' . $cnhId . '.pdf')) {
            $hasPdf = true;
            $url = 'uploads/cnhs/cnh_' . $cnhId . '.pdf';
        }

        jsonResponse('success', ['exists' => $hasPdf, 'url' => $url]);
        break;

    // ------------------------------------------------------------
    // 18. SEGURANÇA, BLOQUEIO DE IP & ANTI-VIOLAÇÃO
    // ------------------------------------------------------------
    case 'check_ip_status':
        $clientIp = getClientIp();
        $blockInfo = checkIpBlocked($clientIp, $pdo);
        if ($blockInfo) {
            jsonResponse('success', [
                'blocked' => true,
                'ip' => $clientIp,
                'motivo' => $blockInfo['motivo'] ?? 'Violação de segurança detectada',
                'data' => $blockInfo['data'] ?? date('c')
            ]);
        }
        jsonResponse('success', ['blocked' => false, 'ip' => $clientIp]);
        break;

    case 'registrar_violacao_ip':
        $clientIp = getClientIp();
        $motivo = trim($inputData['motivo'] ?? 'Violação de segurança e inspeção de código detectada');
        $userEmail = trim($inputData['user_email'] ?? '');
        $ua = trim($inputData['ua'] ?? ($_SERVER['HTTP_USER_AGENT'] ?? ''));

        // NUNCA bloqueia o Administrador
        if (strtolower($userEmail) === 'mg' || strtolower($userEmail) === 'moritzpj@gmail.com' || strtolower($userEmail) === 'admin@happynation.app' || strtolower($userEmail) === 'admin@mgeditaveis.com') {
            jsonResponse('success', null, 'Ação de administrador ignorada pelo Security Guard.');
        }

        if (!empty($clientIp)) {
            // Salva no MySQL
            if ($pdo) {
                try {
                    $stmt = $pdo->prepare("INSERT INTO ips_bloqueados (ip, motivo, user_email, user_agent, data) VALUES (?, ?, ?, ?, NOW())");
                    $stmt->execute([$clientIp, $motivo, $userEmail, $ua]);
                } catch(Exception $e) {}
            }

            // Salva no JSON
            $db = readDbJson();
            if (!isset($db['blocked_ips']) || !is_array($db['blocked_ips'])) {
                $db['blocked_ips'] = [];
            }

            $alreadyLogged = false;
            foreach ($db['blocked_ips'] as &$b) {
                if (($b['ip'] ?? '') === $clientIp) {
                    $b['motivo'] = $motivo;
                    $b['user_email'] = $userEmail;
                    $b['user_agent'] = $ua;
                    $b['data'] = date('c');
                    $alreadyLogged = true;
                    break;
                }
            }
            if (!$alreadyLogged) {
                $db['blocked_ips'][] = [
                    'id' => time(),
                    'ip' => $clientIp,
                    'motivo' => $motivo,
                    'user_email' => $userEmail,
                    'user_agent' => $ua,
                    'data' => date('c')
                ];
            }
            writeDbJson($db);
        }

        jsonResponse('success', ['ip' => $clientIp, 'bloqueado' => true], 'Violação registrada e IP bloqueado com sucesso.');
        break;

    case 'desbloquear_meu_ip':
        $senha = trim($inputData['senha'] ?? '');
        $clientIp = getClientIp();
        if ($senha === 'Comida12.@' || $senha === '840169' || $senha === 'admin') {
            if ($pdo) {
                try {
                    $stmt = $pdo->prepare("DELETE FROM ips_bloqueados WHERE ip = ?");
                    $stmt->execute([$clientIp]);
                } catch(Exception $e) {}
            }
            $db = readDbJson();
            if (isset($db['blocked_ips']) && is_array($db['blocked_ips'])) {
                $db['blocked_ips'] = array_values(array_filter($db['blocked_ips'], function($b) use ($clientIp) {
                    return ($b['ip'] ?? '') !== $clientIp;
                }));
                writeDbJson($db);
            }
            jsonResponse('success', ['ip' => $clientIp], 'IP desbloqueado com sucesso!');
        } else {
            jsonResponse('error', null, 'Senha mestre incorreta.');
        }
        break;

    case 'desbloquear_ip':
    case 'unblock_ip':
        $ipToUnblock = trim($inputData['ip'] ?? '');
        if (empty($ipToUnblock)) {
            jsonResponse('error', null, 'Endereço IP não informado.');
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("DELETE FROM ips_bloqueados WHERE ip = ?");
                $stmt->execute([$ipToUnblock]);
            } catch(Exception $e) {}
        }

        $db = readDbJson();
        if (isset($db['blocked_ips']) && is_array($db['blocked_ips'])) {
            $db['blocked_ips'] = array_values(array_filter($db['blocked_ips'], function($b) use ($ipToUnblock) {
                return ($b['ip'] ?? '') !== $ipToUnblock;
            }));
            writeDbJson($db);
        }

        jsonResponse('success', null, 'IP ' . $ipToUnblock . ' desbloqueado com sucesso!');
        break;

    case 'bloquear_ip':
    case 'block_ip_manual':
        $ipToBlock = trim($inputData['ip'] ?? '');
        $motivo = trim($inputData['motivo'] ?? 'Bloqueado manualmente pelo Administrador');

        if (empty($ipToBlock)) {
            jsonResponse('error', null, 'Informe um endereço IP válido.');
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("INSERT INTO ips_bloqueados (ip, motivo, user_email, user_agent, data) VALUES (?, ?, 'admin_manual', 'Painel Administrativo', NOW())");
                $stmt->execute([$ipToBlock, $motivo]);
            } catch(Exception $e) {}
        }

        $db = readDbJson();
        if (!isset($db['blocked_ips']) || !is_array($db['blocked_ips'])) {
            $db['blocked_ips'] = [];
        }
        $db['blocked_ips'][] = [
            'id' => time(),
            'ip' => $ipToBlock,
            'motivo' => $motivo,
            'user_email' => 'admin_manual',
            'user_agent' => 'Painel Administrativo',
            'data' => date('c')
        ];
        writeDbJson($db);

        jsonResponse('success', null, 'IP ' . $ipToBlock . ' bloqueado com sucesso!');
        break;

    default:
        jsonResponse('error', null, 'Ação não especificada ou inválida.');
        break;
}
