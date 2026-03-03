<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$email = clean_input($_POST['email'] ?? '');
$otp = clean_input($_POST['otp'] ?? '');

if (empty($email) || empty($otp)) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

// Check OTP and Expiry
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND otp = ? AND otp_expiry > NOW()");
$stmt->bind_param("ss", $email, $otp);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    // OTP Valid
    // Set session to allow password reset for this email
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    $_SESSION['reset_email'] = $email;
    
    echo json_encode(['success' => true, 'message' => 'OTP Verified']);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired OTP']);
}

$stmt->close();
?>