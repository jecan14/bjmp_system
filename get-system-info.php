<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$system_info = [
    'php_version' => phpversion(),
    'db_server_version' => $conn->server_info,
    'db_connection_status' => $conn->stat(),
    'timezone' => date_default_timezone_get()
];

echo json_encode(['success' => true, 'info' => $system_info]);

$conn->close();
?>