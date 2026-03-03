<?php
require_once 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$email = clean_input($_POST['email'] ?? '');

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email is required']);
    exit;
}

// Check if email exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ? AND status = 'active'");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    // Security: Don't reveal if email exists or not, but for this task we'll be explicit
    echo json_encode(['success' => false, 'message' => 'Email not found']);
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Generate 4-digit OTP
$otp = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
$expiry = date('Y-m-d H:i:s', strtotime('+10 minutes'));

// Store OTP in database
$update = $conn->prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?");
$update->bind_param("ssi", $otp, $expiry, $user['id']);

if ($update->execute()) {
    // SIMULATION: Return OTP in response for localhost testing
    echo json_encode(['success' => true, 'message' => 'OTP sent', 'otp' => $otp]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>