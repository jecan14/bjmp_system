<?php
require_once 'config.php';

header('Content-Type: application/json');

// Check if POST request
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

// Get and sanitize input
$username = clean_input($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

// Validate input
if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all fields']);
    exit;
}

// Prepare statement to get user
$stmt = $conn->prepare("SELECT id, username, password, name, email, role, failed_attempts, locked_until FROM users WHERE username = ? AND status = 'active'");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

// Check if user exists
if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Check if account is locked
if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
    $remaining = strtotime($user['locked_until']) - time();
    echo json_encode([
        'success' => false,
        'message' => 'Account temporarily locked. Please try again in ' . $remaining . ' seconds.',
        'locked' => true,
        'attempts' => 3
    ]);
    exit;
}

// Verify password
if (!password_verify($password, $user['password'])) {
    // Increment failed attempts
    $failed_attempts = $user['failed_attempts'] + 1;
    $locked_until = null;
    
    // Lock account after 3 failed attempts
    if ($failed_attempts >= 3) {
        $locked_until = date('Y-m-d H:i:s', time() + 30); // Lock for 30 seconds
    }
    
    // Update failed attempts
    $update_stmt = $conn->prepare("UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?");
    $update_stmt->bind_param("isi", $failed_attempts, $locked_until, $user['id']);
    $update_stmt->execute();
    $update_stmt->close();
    
    // Log failed attempt
    log_activity($user['id'], 'login_failed', 'Failed login attempt');
    
    echo json_encode([
        'success' => false,
        'message' => 'Invalid username or password',
        'attempts' => $failed_attempts,
        'locked' => $failed_attempts >= 3
    ]);
    exit;
}

// Successful login - Reset failed attempts
$reset_stmt = $conn->prepare("UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?");
$reset_stmt->bind_param("i", $user['id']);
$reset_stmt->execute();
$reset_stmt->close();

// Set session variables
$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['name'] = $user['name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];
$_SESSION['logged_in_at'] = time();

// Log successful login
log_activity($user['id'], 'login_success', 'User logged in successfully');

// Return success
echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'role' => $user['role'],
    'name' => $user['name']
]);

$conn->close();
?>
