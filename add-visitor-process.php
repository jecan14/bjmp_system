<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get and sanitize input
$visitor_name = clean_input($_POST['visitor_name'] ?? '');
$visitor_id_number = clean_input($_POST['visitor_id_number'] ?? '');
$visitor_contact = clean_input($_POST['visitor_contact'] ?? '');
$relationship = clean_input($_POST['relationship'] ?? '');
$detainee_id = intval($_POST['detainee_id'] ?? 0);
$visit_date = clean_input($_POST['visit_date'] ?? '');
$visit_time = clean_input($_POST['visit_time'] ?? '');
$notes = clean_input($_POST['notes'] ?? '');
$logged_by = get_user_id();

// Validate required fields
if (empty($visitor_name) || empty($visitor_contact) || empty($relationship) || empty($detainee_id) || empty($visit_date) || empty($visit_time)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate detainee exists
$check_detainee = $conn->prepare("SELECT id FROM detainees WHERE id = ? AND status = 'active'");
$check_detainee->bind_param("i", $detainee_id);
$check_detainee->execute();
$result = $check_detainee->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid detainee selected']);
    exit;
}
$check_detainee->close();

// Insert visitor record
$stmt = $conn->prepare("INSERT INTO visitors (visitor_name, visitor_id_number, visitor_contact, relationship, detainee_id, visit_date, visit_time, notes, logged_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssisssi", $visitor_name, $visitor_id_number, $visitor_contact, $relationship, $detainee_id, $visit_date, $visit_time, $notes, $logged_by);

if ($stmt->execute()) {
    $visitor_id = $stmt->insert_id;
    
    // Log activity
    log_activity($logged_by, 'add_visitor', "Logged visitor: $visitor_name for detainee ID: $detainee_id");
    
    echo json_encode([
        'success' => true,
        'message' => 'Visitor logged successfully',
        'visitor_id' => $visitor_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error logging visitor: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
