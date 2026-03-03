<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$sql = "
    SELECT 
        main.action, 
        COUNT(*) as total_count, 
        MAX(main.created_at) as last_occurred,
        (SELECT u.name FROM users u JOIN system_logs sl ON u.id = sl.user_id WHERE sl.id = MAX(main.id)) as latest_user
    FROM 
        system_logs as main
    GROUP BY 
        main.action
    ORDER BY 
        last_occurred DESC
";

$result = $conn->query($sql);

if ($result) {
    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = $row;
    }
    echo json_encode(['success' => true, 'logs' => $logs]);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to retrieve system logs.']);
}

$conn->close();
?>