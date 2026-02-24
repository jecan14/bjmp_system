<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$detainee_number = clean_input($_POST['detainee_number']);
$first_name = clean_input($_POST['first_name']);
$last_name = clean_input($_POST['last_name']);
$middle_name = clean_input($_POST['middle_name']);
$date_of_birth = clean_input($_POST['date_of_birth']);
$status = clean_input($_POST['status']);

if (empty($detainee_number) || empty($first_name) || empty($last_name) || empty($date_of_birth)) {
    echo json_encode(['success' => false, 'message' => 'Please fill in all required fields']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO detainees (detainee_number, first_name, last_name, middle_name, date_of_birth, status) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssss", $detainee_number, $first_name, $last_name, $middle_name, $date_of_birth, $status);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Individual added successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error adding individual: ' . $conn->error]);
}
$stmt->close();
$conn->close();
?>