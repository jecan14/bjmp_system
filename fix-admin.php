<?php
require_once 'config.php';

// Reset Admin Password to 'password123'
$password = 'password123';
$hash = password_hash($password, PASSWORD_DEFAULT);
$username = 'admin';

// Update password and unlock account
$stmt = $conn->prepare("UPDATE users SET password = ?, failed_attempts = 0, locked_until = NULL WHERE username = ?");
$stmt->bind_param("ss", $hash, $username);

if ($stmt->execute()) {
    echo "<h1>✅ Success!</h1>";
    echo "<p>Admin password has been reset to: <strong>$password</strong></p>";
    echo "<p>Account has been unlocked.</p>";
    echo "<p><a href='login.html'>Go to Login Page</a></p>";
} else {
    echo "Error: " . $conn->error;
}
?>