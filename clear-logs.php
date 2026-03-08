<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in and is an admin
if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = get_user_id();

// Truncate the system_logs table
$sql = "TRUNCATE TABLE system_logs";

if ($conn->query($sql) === TRUE) {
    // Log this action itself (it will be the only log left)
    log_activity($user_id, 'LOGS_CLEARED', 'Admin cleared the system activity logs.');
    echo json_encode(['success' => true, 'message' => 'System activity logs have been cleared.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to clear logs: ' . $conn->error]);
}

$conn->close();
?>