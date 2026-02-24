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
$detainee_name = clean_input($_POST['detainee_name'] ?? '');
$visit_date = clean_input($_POST['visit_date'] ?? '');
$visit_time = clean_input($_POST['visit_time'] ?? '');
$notes = clean_input($_POST['notes'] ?? '');
$logged_by = get_user_id();

// Validate required fields
if (empty($visitor_name) || empty($visitor_contact) || empty($relationship) || empty($detainee_name) || empty($visit_date) || empty($visit_time)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// "Smart" search for detainee ID from name.
// This splits the input by spaces and commas, and searches for each word in the name fields.
$search_terms = preg_split('/[\s,]+/', $detainee_name, -1, PREG_SPLIT_NO_EMPTY);
$conditions = [];
$params = [];
$types = "";

if (empty($search_terms)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a detainee name to search.']);
    exit;
}

$sql = "SELECT id FROM detainees WHERE status = 'active' AND ";

foreach ($search_terms as $term) {
    $conditions[] = "(first_name LIKE ? OR last_name LIKE ? OR middle_name LIKE ?)";
    $param_term = "%" . $term . "%";
    array_push($params, $param_term, $param_term, $param_term);
    $types .= "sss";
}

$sql .= implode(' AND ', $conditions);
$check_detainee = $conn->prepare($sql);
$check_detainee->bind_param($types, ...$params);
$check_detainee->execute();
$result = $check_detainee->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => "No active detainee found matching '$detainee_name'. Please check the name."]);
    exit;
}

if ($result->num_rows > 1) {
    echo json_encode(['success' => false, 'message' => "Multiple active detainees found for '$detainee_name'. Please be more specific or use the full name."]);
    exit;
}

$detainee_row = $result->fetch_assoc();
$detainee_id = $detainee_row['id'];
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
