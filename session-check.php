<?php
require_once 'config.php';

header('Content-Type: application/json');

if (is_logged_in()) {
    echo json_encode([
        'logged_in' => true,
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'name' => $_SESSION['name'],
        'email' => $_SESSION['email'],
        'role' => $_SESSION['role']
    ]);
} else {
    echo json_encode([
        'logged_in' => false
    ]);
}
?>