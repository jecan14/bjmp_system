<?php
require_once 'config.php';
header('Content-Type: application/json');

// Ensure user is logged in and is an admin
if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$stats = [
    'total_officers' => 0,
    'total_detainees' => 0,
    'today_visitors' => 0,
    'total_visitors' => 0,
    'currently_inside' => 0,
];

// Get total officers
$result = $conn->query("SELECT COUNT(*) as count FROM users WHERE role = 'officer'");
if ($result) {
    $stats['total_officers'] = $result->fetch_assoc()['count'];
}

// Get total active detainees
$result = $conn->query("SELECT COUNT(*) as count FROM detainees WHERE status = 'active'");
if ($result) {
    $stats['total_detainees'] = $result->fetch_assoc()['count'];
}

// Get today's visitors
$today = date('Y-m-d');
$stmt = $conn->prepare("SELECT COUNT(*) as count FROM visitors WHERE visit_date = ?");
$stmt->bind_param("s", $today);
$stmt->execute();
$result = $stmt->get_result();
if ($result) {
    $stats['today_visitors'] = $result->fetch_assoc()['count'];
}
$stmt->close();

// Get total visitors
$result = $conn->query("SELECT COUNT(*) as count FROM visitors");
if ($result) {
    $stats['total_visitors'] = $result->fetch_assoc()['count'];
}

// Get currently inside visitors
$result = $conn->query("SELECT COUNT(*) as count FROM visitors WHERE checkout_time IS NULL");
if ($result) {
    $stats['currently_inside'] = $result->fetch_assoc()['count'];
}

echo json_encode(['success' => true] + $stats);

$conn->close();
?>