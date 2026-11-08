<?php
// ============================================================
// CONFIGURAÇÃO GERAL, CONEXÃO MYSQL & DADOS JSON (XAMPP / HOSTGATOR)
// ============================================================

// Permite CORS para requisições do frontend
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$ROOT_DIR = __DIR__;
$DB_JSON_FILE = $ROOT_DIR . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'db.json';
$CONFIG_JSON_FILE = $ROOT_DIR . DIRECTORY_SEPARATOR . 'app' . DIRECTORY_SEPARATOR . 'config.json';
$SQL_FILE = $ROOT_DIR . DIRECTORY_SEPARATOR . 'database.sql';

// ------------------------------------------------------------
// HELPERS PARA BANCO DE DADOS JSON (FALLBACK & PERSISTÊNCIA)
// ------------------------------------------------------------
function readDbJson() {
    global $DB_JSON_FILE;
    if (!file_exists($DB_JSON_FILE)) return ['users' => [], 'cnhs' => [], 'recargas' => [], 'tickets' => [], 'activities' => [], 'roadmap' => []];
    $content = file_get_contents($DB_JSON_FILE);
    $data = json_decode($content, true);
    if (!is_array($data)) $data = [];
    $cols = ['users', 'cnhs', 'recargas', 'tickets', 'activities', 'roadmap'];
    foreach ($cols as $c) {
        if (!isset($data[$c]) || !is_array($data[$c])) $data[$c] = [];
    }
    return $data;
}

function writeDbJson($data) {
    global $DB_JSON_FILE;
    $dir = dirname($DB_JSON_FILE);
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    @file_put_contents($DB_JSON_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function readConfigJson() {
    global $CONFIG_JSON_FILE;
    if (!file_exists($CONFIG_JSON_FILE)) return [];
    $content = file_get_contents($CONFIG_JSON_FILE);
    $data = json_decode($content, true);
    return is_array($data) ? $data : [];
}

function writeConfigJson($data) {
    global $CONFIG_JSON_FILE;
    $dir = dirname($CONFIG_JSON_FILE);
    if (!is_dir($dir)) @mkdir($dir, 0777, true);
    @file_put_contents($CONFIG_JSON_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

// ------------------------------------------------------------
// CONEXÃO COM MYSQL (COM DETECÇÃO AUTOMÁTICA XAMPP)
// ------------------------------------------------------------
// ------------------------------------------------------------
// CONEXÃO COM MYSQL (COMPATÍVEL COM XAMPP PÚBLICO E HOSTGATOR)
// Funciona tanto se acessado por localhost quanto por IP público/domínio
// ------------------------------------------------------------
$pdo = null;

// 1. TENTA PRIMEIRO O MYSQL LOCAL DO XAMPP (independente de qual domínio o cliente usou)
$passwordsToTry = ['root', '', '123456'];
$DB_HOST = '127.0.0.1';
$DB_NAME = 'test';
$DB_USER = 'root';

foreach ($passwordsToTry as $pass) {
    try {
        // Conecta ao banco 'test' do MySQL
        $pdo = new PDO("mysql:host={$DB_HOST};port=3306;dbname={$DB_NAME};charset=utf8mb4", $DB_USER, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);

        // Se a tabela 'usuarios' não existir no banco 'test', inicializa com database.sql automaticamente
        try {
            $check = $pdo->query("SHOW TABLES LIKE 'usuarios'")->fetch();
            if (!$check && file_exists($SQL_FILE)) {
                $sql = file_get_contents($SQL_FILE);
                $pdo->exec($sql);
            }
        } catch(Exception $ex) {}

        break;
    } catch (PDOException $e) {
        // Se o banco 'test' ainda não foi criado no MySQL, tenta criar
        try {
            $tempPdo = new PDO("mysql:host={$DB_HOST};port=3306;charset=utf8mb4", $DB_USER, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $tempPdo->exec("USE `{$DB_NAME}`");

            if (file_exists($SQL_FILE)) {
                $sql = file_get_contents($SQL_FILE);
                $tempPdo->exec($sql);
            }
            $pdo = $tempPdo;
            break;
        } catch (PDOException $e2) {
            // Tenta próxima senha
        }
    }
}

// 2. Se o MySQL do XAMPP não estiver rodando, tenta conexão de produção externa (HostGator) como fallback
if (!$pdo) {
    try {
        $pdo = new PDO("mysql:host=localhost;dbname=juli1036_mg;charset=utf8mb4", 'juli1036_vendas', 'Comida12.', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
        ]);
    } catch (PDOException $e) {
        $pdo = null;
    }
}

// ------------------------------------------------------------
// FUNÇÃO DE RESPOSTA JSON
// ------------------------------------------------------------
function jsonResponse($status, $data = null, $message = '') {
    echo json_encode([
        'status' => $status,
        'message' => $message,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}
