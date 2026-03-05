<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check request method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get inputs
$id = $_POST['id'] ?? '';
$status = $_POST['status'] ?? '';

if (empty($id) || empty($status)) {
    echo json_encode(['success' => false, 'message' => 'Missing ID or Status']);
    exit;
}

// Update query
// We update the 'status' column in the 'users' table
$stmt = $conn->prepare("UPDATE users SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Status updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>