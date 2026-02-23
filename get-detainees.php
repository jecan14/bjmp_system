<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sql = "SELECT * FROM detainees WHERE status = 'active' ORDER BY last_name ASC";
$result = $conn->query($sql);
$detainees = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $detainees[] = $row;
    }
}

echo json_encode(['success' => true, 'detainees' => $detainees]);
$conn->close();
?>