<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = get_user_id(); // Assuming this function exists and returns the logged-in user's ID

$visitor_id = intval($_GET['id'] ?? 0);

if ($visitor_id === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid visitor ID']);
    exit;
}

$sql = "SELECT v.*, d.first_name as detainee_first_name, d.last_name as detainee_last_name, 
               d.middle_name as detainee_middle_name, d.detainee_number,
               u.name as officer_name
        FROM visitors v
        LEFT JOIN detainees d ON v.detainee_id = d.id
        LEFT JOIN users u ON v.logged_by = u.id
        WHERE v.id = ?"; 

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
    exit;
}

$stmt->bind_param("i", $visitor_id);
$stmt->execute();
$result = $stmt->get_result();
$visitor = $result->fetch_assoc();

if ($visitor) {
    // Add created_at to the visitor object for display purposes
    // This assumes 'created_at' is a column in the 'visitors' table
    // If not, you might need to fetch it separately or adjust the query.
    // For now, let's assume it's there.
    if (!isset($visitor['created_at'])) {
        // Placeholder if created_at is not in the main query, or fetch from DB if needed
        $visitor['created_at'] = date('Y-m-d H:i:s'); 
    }
    echo json_encode(['success' => true, 'visitor' => $visitor]);
} else {
    echo json_encode(['success' => false, 'message' => 'Visitor not found or you do not have permission to view this record.']);
}

$stmt->close();
$conn->close();
?>