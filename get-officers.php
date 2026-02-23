<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sql = "SELECT id, name, username, email, contact_number FROM users WHERE role = 'officer' ORDER BY name ASC";
$result = $conn->query($sql);
$officers = [];

if ($result) {
    while ($row = $result->fetch_assoc()) {
        $officers[] = $row;
    }
}

echo json_encode(['success' => true, 'officers' => $officers]);
$conn->close();
?>