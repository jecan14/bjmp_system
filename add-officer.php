<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$name = clean_input($_POST['name']);
$username = clean_input($_POST['username']);
$email = clean_input($_POST['email']);
$contact = clean_input($_POST['contact_number']);
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

// Check if username exists
$check = $conn->query("SELECT id FROM users WHERE username = '$username'");
if ($check->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username already exists']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO users (name, username, email, contact_number, password, role, status) VALUES (?, ?, ?, ?, ?, 'officer', 'active')");
$stmt->bind_param("sssss", $name, $username, $email, $contact, $password);

if ($stmt->execute()) {
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
$conn->close();
?>