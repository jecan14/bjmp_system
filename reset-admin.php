<?php
require_once 'config.php';

// Configuration
$username = 'admin';
$password = 'password123'; // This will be your new password

// Hash the password
$hash = password_hash($password, PASSWORD_DEFAULT);

// Check if user exists
$check = $conn->prepare("SELECT id FROM users WHERE username = ?");
$check->bind_param("s", $username);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    // Update existing user (Reset password, unlock account, ensure active status)
    $stmt = $conn->prepare("UPDATE users SET password = ?, role = 'admin', status = 'active', failed_attempts = 0, locked_until = NULL WHERE username = ?");
    $stmt->bind_param("ss", $hash, $username);
    $action = "updated";
} else {
    // Create new user
    $stmt = $conn->prepare("INSERT INTO users (username, password, name, email, contact_number, role, status) VALUES (?, ?, 'System Administrator', 'admin@bjmp.gov.ph', '09123456789', 'admin', 'active')");
    $stmt->bind_param("ss", $username, $hash);
    $action = "created";
}

if ($stmt->execute()) {
    echo "<h1>Admin Account Successfully $action</h1>";
    echo "<p>Username: <strong>$username</strong></p>";
    echo "<p>Password: <strong>$password</strong></p>";
    echo "<p><a href='login.html'>Go to Login Page</a></p>";
} else {
    echo "Error: " . $conn->error;
}

$stmt->close();
$conn->close();
?>