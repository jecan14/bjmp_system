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

// Check if visitor exists and belongs to the logged-in officer, and is not already checked out
$check_sql = "SELECT id, checkout_time FROM visitors WHERE id = ? AND logged_by = ?";
$check_stmt = $conn->prepare($check_sql);
if ($check_stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare check statement: ' . $conn->error]);
    exit;
}
$check_stmt->bind_param("ii", $visitor_id, $user_id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();
$visitor_data = $check_result->fetch_assoc();
$check_stmt->close();

if (!$visitor_data) {
    echo json_encode(['success' => false, 'message' => 'Visitor not found or you do not have permission.']);
    exit;
}

if ($visitor_data['checkout_time'] !== null) {
    echo json_encode(['success' => false, 'message' => 'Visitor already checked out.']);
    exit;
}

$checkout_time = date('H:i:s'); // Current time

$update_sql = "UPDATE visitors SET checkout_time = ? WHERE id = ?";
$update_stmt = $conn->prepare($update_sql);
if ($update_stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare update statement: ' . $conn->error]);
    exit;
}
$update_stmt->bind_param("si", $checkout_time, $visitor_id);

if ($update_stmt->execute()) {
    log_activity($user_id, 'checkout_visitor', "Checked out visitor ID: $visitor_id"); // Assuming log_activity exists
    echo json_encode(['success' => true, 'message' => 'Visitor checked out successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to check out visitor: ' . $update_stmt->error]);
}

$update_stmt->close();
$conn->close();
?>