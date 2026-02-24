<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$user_id = get_user_id(); // Assuming this function exists and returns the logged-in user's ID
$user_role = get_user_role(); // Get the role from the session

// Get search and filter parameters
$search = clean_input($_GET['search'] ?? '');
$dateFilter = clean_input($_GET['date'] ?? '');
$detaineeFilter = intval($_GET['detainee'] ?? 0);

$sql = "SELECT v.*, d.first_name as detainee_first_name, d.last_name as detainee_last_name, 
               u.name as officer_name
        FROM visitors v
        LEFT JOIN detainees d ON v.detainee_id = d.id
        LEFT JOIN users u ON v.logged_by = u.id";

$conditions = [];
$params = [];
$types = "";

// If user is an officer, only show their logs. Admin sees all.
if ($user_role === 'officer') {
    $conditions[] = "v.logged_by = ?";
    $params[] = $user_id;
    $types .= "i";
}

if (!empty($search)) {
    $conditions[] = "(v.visitor_name LIKE ? OR v.visitor_contact LIKE ? OR v.visitor_id_number LIKE ?)";
    $search_param = "%" . $search . "%";
    $params[] = $search_param;
    $params[] = $search_param;
    $params[] = $search_param;
    $types .= "sss";
}

if (!empty($dateFilter)) {
    $conditions[] = "v.visit_date = ?";
    $params[] = $dateFilter;
    $types .= "s";
}

if ($detaineeFilter > 0 && $user_role === 'admin') {
    $conditions[] = "v.detainee_id = ?";
    $params[] = $detaineeFilter;
    $types .= "i";
}

if (!empty($conditions)) {
    $sql .= " WHERE " . implode(" AND ", $conditions);
}

$sql .= " ORDER BY v.visit_date DESC, v.visit_time DESC";

$stmt = $conn->prepare($sql);
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Failed to prepare statement: ' . $conn->error]);
    exit;
}
if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}
$stmt->execute();
$result = $stmt->get_result();

$visitors = [];
while ($row = $result->fetch_assoc()) {
    $visitors[] = $row;
}

echo json_encode(['success' => true, 'visitors' => $visitors]);

$stmt->close();
$conn->close();
?>