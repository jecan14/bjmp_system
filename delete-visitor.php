<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized or Invalid Request']);
    exit;
}

$visitor_id = intval($_POST['visitor_id']);

$stmt = $conn->prepare("DELETE FROM visitors WHERE id = ?");
$stmt->bind_param("i", $visitor_id);

if ($stmt->execute()) {
    log_activity(get_user_id(), 'delete_visitor', "Deleted visitor ID: $visitor_id");
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

$stmt->close();
$conn->close();
?>