<?php
require_once 'config.php';
header('Content-Type: application/json');

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// Verify session exists (security check)
if (!isset($_SESSION['reset_email'])) {
    echo json_encode(['success' => false, 'message' => 'Session expired. Please start over.']);
    exit;
}

$email = $_SESSION['reset_email'];
$password = $_POST['password'] ?? '';

if (strlen($password) < 8) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 8 characters']);
    exit;
}

// Hash new password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Update password and clear OTP
$stmt = $conn->prepare("UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE email = ?");
$stmt->bind_param("ss", $hashed_password, $email);

if ($stmt->execute()) {
    // Clear session
    unset($_SESSION['reset_email']);
    
    echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

$stmt->close();
?>