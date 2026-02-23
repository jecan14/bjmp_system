<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = get_user_id();
$today = date('Y-m-d');

// Today's Visitors
$sql_today = "SELECT COUNT(*) as count FROM visitors WHERE visit_date = '$today'";
$today_visitors = $conn->query($sql_today)->fetch_assoc()['count'];

// Active Detainees
$sql_detainees = "SELECT COUNT(*) as count FROM detainees WHERE status = 'active'";
$active_detainees = $conn->query($sql_detainees)->fetch_assoc()['count'];

// My Logs
$sql_logs = "SELECT COUNT(*) as count FROM visitors WHERE logged_by = $user_id";
$my_logs = $conn->query($sql_logs)->fetch_assoc()['count'];

// Currently Inside (No checkout time)
$sql_inside = "SELECT COUNT(*) as count FROM visitors WHERE checkout_time IS NULL";
$currently_inside = $conn->query($sql_inside)->fetch_assoc()['count'];

echo json_encode([
    'success' => true,
    'today_visitors' => $today_visitors,
    'active_detainees' => $active_detainees,
    'my_logs' => $my_logs,
    'currently_inside' => $currently_inside
]);
$conn->close();
?>