<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sql = "SELECT v.*, d.first_name, d.last_name, u.name as officer_name 
        FROM visitors v 
        LEFT JOIN detainees d ON v.detainee_id = d.id 
        LEFT JOIN users u ON v.logged_by = u.id 
        ORDER BY v.visit_date DESC, v.visit_time DESC";

$result = $conn->query($sql);
$visitors = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $row['detainee_name'] = $row['first_name'] . ' ' . $row['last_name'];
        $visitors[] = $row;
    }
}

echo json_encode(['success' => true, 'visitors' => $visitors]);
$conn->close();
?>