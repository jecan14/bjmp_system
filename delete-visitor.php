<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = get_user_id();
$visitor_id = intval($_POST['visitor_id'] ?? 0);

if ($visitor_id === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid visitor ID']);
    exit;
}

// Check if visitor exists and belongs to the logged-in officer
$check_sql = "SELECT id FROM visitors WHERE id = ? AND logged_by = ?";
$check_stmt = $conn->prepare($check_sql);
if ($check_stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare check statement: ' . $conn->error]);
    exit;
}
$check_stmt->bind_param("ii", $visitor_id, $user_id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();
$visitor_exists = $check_result->fetch_assoc();
$check_stmt->close();

if (!$visitor_exists) {
    echo json_encode(['success' => false, 'message' => 'Visitor not found or you do not have permission to delete this record.']);
    exit;
}

$delete_sql = "DELETE FROM visitors WHERE id = ?";
$delete_stmt = $conn->prepare($delete_sql);
if ($delete_stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare delete statement: ' . $conn->error]);
    exit;
}
$delete_stmt->bind_param("i", $visitor_id);

if ($delete_stmt->execute()) {
    log_activity($user_id, 'delete_visitor', "Deleted visitor record ID: $visitor_id"); // Assuming log_activity exists
    echo json_encode(['success' => true, 'message' => 'Visitor record deleted successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete visitor record: ' . $delete_stmt->error]);
}

$delete_stmt->close();
$conn->close();
?>