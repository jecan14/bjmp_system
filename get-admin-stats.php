<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Total Officers
$sql_officers = "SELECT COUNT(*) as count FROM users WHERE role = 'officer'";
$result_officers = $conn->query($sql_officers);
$total_officers = $result_officers ? $result_officers->fetch_assoc()['count'] : 0;

// Total Detainees
$sql_detainees = "SELECT COUNT(*) as count FROM detainees";
$result_detainees = $conn->query($sql_detainees);
$total_detainees = $result_detainees ? $result_detainees->fetch_assoc()['count'] : 0;

echo json_encode([
    'success' => true,
    'total_officers' => $total_officers,
    'total_detainees' => $total_detainees
]);
$conn->close();
?>