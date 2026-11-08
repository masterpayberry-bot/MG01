<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/admin';

$config = json_decode(file_get_contents(__DIR__ . '/../app/config.json'), true);
$cloakerVal = $config['cloakerAdminEnabled'] ?? false;
$cloakerEnabled = ($cloakerVal === true || $cloakerVal === 'true' || $cloakerVal === 1 || $cloakerVal === '1');
$expectedKey = trim((string)($config['cloakerAdminKey'] ?? 'adm_171'));
$redirectUrl = trim((string)($config['cloakerAdminRedirect'] ?? 'login.html'));

$providedKey = '';
$uri = $_SERVER['REQUEST_URI'] ?? '';
$pathOnly = parse_url($uri, PHP_URL_PATH);
if (preg_match('/\/admin_([a-zA-Z0-9_\-]+)/i', $pathOnly, $matches)) {
    $providedKey = trim($matches[1]);
}

echo "CloakerEnabled: " . ($cloakerEnabled ? 'YES' : 'NO') . "\n";
echo "ProvidedKey: '$providedKey'\n";
echo "ExpectedKey: '$expectedKey'\n";
if ($cloakerEnabled && !empty($expectedKey)) {
    if ($providedKey !== $expectedKey) {
        echo "RESULT: REDIRECT TO $redirectUrl\n";
    } else {
        echo "RESULT: SERVE admin.html\n";
    }
}
