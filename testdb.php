<?php
$conn = mysqli_connect('localhost', 'u637260032_bjmp_admin', '@dmin1234!', 'u637260032_bjmp_system', 3306);

if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
} else {
    echo "Database connected successfully!";
}
?>