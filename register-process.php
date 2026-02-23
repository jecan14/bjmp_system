<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get and sanitize input
$name = clean_input($_POST['name'] ?? '');
$username = clean_input($_POST['username'] ?? '');
$email = clean_input($_POST['email'] ?? '');
$contact_number = clean_input($_POST['number'] ?? '');
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// Validate required fields
if (empty($name) || empty($username) || empty($email) || empty($contact_number) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

// Validate password length
if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long']);
    exit;
}

// Validate password match
if ($password !== $confirm_password) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match']);
    exit;
}

// Check if username already exists
$check_username = $conn->prepare("SELECT id FROM users WHERE username = ?");
$check_username->bind_param("s", $username);
$check_username->execute();
$result = $check_username->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Username already exists']);
    exit;
}
$check_username->close();

// Check if email already exists
$check_email = $conn->prepare("SELECT id FROM users WHERE email = ?");
$check_email->bind_param("s", $email);
$check_email->execute();
$result = $check_email->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Email already exists']);
    exit;
}
$check_email->close();

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert new user (default role: officer)
$stmt = $conn->prepare("INSERT INTO users (username, password, name, email, contact_number, role, status) VALUES (?, ?, ?, ?, ?, 'officer', 'active')");
$stmt->bind_param("sssss", $username, $hashed_password, $name, $email, $contact_number);

if ($stmt->execute()) {
    $user_id = $stmt->insert_id;
    
    // Log registration
    log_activity($user_id, 'register', 'New officer account created');
    
    echo json_encode([
        'success' => true,
        'message' => 'Account created successfully'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed. Please try again.'
    ]);
}

$stmt->close();
$conn->close();
?>
