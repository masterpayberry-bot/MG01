<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/admin';
ob_start();
// Use register_shutdown_function to check headers after exit
register_shutdown_function(function() {
    print_r(headers_list());
});
require __DIR__ . '/../admin.php';
