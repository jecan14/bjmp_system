<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$detainee_id = intval($_POST['id'] ?? 0);

if ($detainee_id === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid ID']);
    exit;
}

// Prepare delete statement
$stmt = $conn->prepare("DELETE FROM detainees WHERE id = ?");
$stmt->bind_param("i", $detainee_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Individual deleted successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error deleting individual: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>