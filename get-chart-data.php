<?php
require_once 'config.php';
header('Content-Type: application/json');

if (!is_logged_in() || !is_admin()) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$period = $_GET['period'] ?? 'daily';

$labels = [];
$data = [];

if ($period === 'daily') {
    // Data for the last 7 days
    $labels = [];
    $data = array_fill(0, 7, 0);
    $date_map = [];

    for ($i = 6; $i >= 0; $i--) {
        $date = new DateTime(date('Y-m-d', strtotime("-$i days")));
        $date_key = $date->format('Y-m-d');
        $labels[6 - $i] = $date->format('D'); // Mon, Tue
        $date_map[$date_key] = 6 - $i;
    }

    $oldest_date = date('Y-m-d', strtotime("-6 days"));

    $sql = "SELECT DATE(visit_date) as date_key, COUNT(id) as count
            FROM visitors
            WHERE visit_date >= ?
            GROUP BY date_key";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $oldest_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if (isset($date_map[$row['date_key']])) {
                $index = $date_map[$row['date_key']];
                $data[$index] = (int)$row['count'];
            }
        }
    }
    $stmt->close();

} elseif ($period === 'weekly') {
    // Data for the last 4 weeks
    $labels = [];
    $data = array_fill(0, 4, 0);
    $date_map = [];

    for ($i = 3; $i >= 0; $i--) {
        $date = new DateTime(date('Y-m-d', strtotime("-$i weeks")));
        $date->modify('monday this week');
        $week_start_key = $date->format('Y-m-d');
        $labels[3 - $i] = "Week of " . $date->format('M d');
        $date_map[$week_start_key] = 3 - $i;
    }

    $oldest_week_start = date('Y-m-d', strtotime("-3 weeks monday this week"));

    $sql = "SELECT STR_TO_DATE(CONCAT(YEAR(visit_date), '/', WEEK(visit_date, 1), '/1'), '%Y/%v/%w') as week_start_key, COUNT(id) as count
            FROM visitors
            WHERE visit_date >= ?
            GROUP BY week_start_key";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $oldest_week_start);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if (isset($date_map[$row['week_start_key']])) {
                $index = $date_map[$row['week_start_key']];
                $data[$index] = (int)$row['count'];
            }
        }
    }
    $stmt->close();

} elseif ($period === 'monthly') {
    // Data for the last 12 months
    $labels = [];
    $data = array_fill(0, 12, 0);
    $date_map = [];

    for ($i = 11; $i >= 0; $i--) {
        $date = new DateTime(date('Y-m-d', strtotime("-$i months")));
        $month_key = $date->format('Y-m');
        $labels[11 - $i] = $date->format('M Y');
        $date_map[$month_key] = 11 - $i;
    }

    $oldest_date = date('Y-m-01', strtotime("-11 months"));

    $sql = "SELECT DATE_FORMAT(visit_date, '%Y-%m') as month_key, COUNT(id) as count FROM visitors WHERE visit_date >= ? GROUP BY month_key";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $oldest_date);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        while ($row = $result->fetch_assoc()) {
            if (isset($date_map[$row['month_key']])) {
                $index = $date_map[$row['month_key']];
                $data[$index] = (int)$row['count'];
            }
        }
    }
    $stmt->close();
}

echo json_encode(['success' => true, 'labels' => $labels, 'data' => $data]);

$conn->close();
?>