<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 5;

$sql = "SELECT v.*, d.first_name, d.last_name 
        FROM visitors v 
        LEFT JOIN detainees d ON v.detainee_id = d.id 
        ORDER BY v.id DESC LIMIT $limit";

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