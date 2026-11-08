<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$postData = [
    'cloakerAdminEnabled' => true,
    'cloakerAdminKey' => 'adm_171',
    'cloakerAdminParam' => 'key',
    'cloakerAdminRedirect' => 'login.html'
];
// Test direct invocation
require __DIR__ . '/../api/config.php';
$current = readConfigJson();
$merged = array_merge($current, $postData);
writeConfigJson($merged);
echo "Written cloakerAdminEnabled: " . json_encode($merged['cloakerAdminEnabled']) . "\n";
