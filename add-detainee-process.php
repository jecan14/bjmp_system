<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$detainee_number = clean_input($_POST['detainee_number']);
$first_name = clean_input($_POST['first_name']);
$last_name = clean_input($_POST['last_name']);
$middle_name = clean_input($_POST['middle_name']);
$date_of_birth = clean_input($_POST['date_of_birth']);
$status = clean_input($_POST['status']);

$stmt = $conn->prepare("INSERT INTO detainees (detainee_number, first_name, last_name, middle_name, date_of_birth, status) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $detainee_number, $first_name, $last_name, $middle_name, $date_of_birth, $status);

if ($stmt->execute()) {
    log_activity(get_user_id(), 'add_detainee', "Added detainee: $first_name $last_name");
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>