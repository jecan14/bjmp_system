<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get recent visitors (Limit 50)
$sql_visitors = "SELECT v.*, d.first_name, d.last_name, u.name as officer_name 
                 FROM visitors v 
                 LEFT JOIN detainees d ON v.detainee_id = d.id 
                 LEFT JOIN users u ON v.logged_by = u.id 
                 ORDER BY v.visit_date DESC, v.visit_time DESC LIMIT 50";
$result_visitors = $conn->query($sql_visitors);
$visitors = [];
if ($result_visitors) {
    while ($row = $result_visitors->fetch_assoc()) {
        $visitors[] = $row;
    }
}

// Get system logs (Limit 50)
$sql_logs = "SELECT l.*, u.username 
             FROM system_logs l 
             LEFT JOIN users u ON l.user_id = u.id 
             ORDER BY l.created_at DESC LIMIT 50";
$result_logs = $conn->query($sql_logs);
$logs = [];
if ($result_logs) {
    while ($row = $result_logs->fetch_assoc()) {
        $logs[] = $row;
    }
}

echo json_encode(['success' => true, 'visitors' => $visitors, 'logs' => $logs]);
$conn->close();
?>