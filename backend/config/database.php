<?php
// =====================================================
// Database connection (MySQL / XAMPP)
// Credentials stay here on the server. They are NEVER
// sent to the React frontend.
// =====================================================

$DB_HOST = "localhost";
$DB_NAME = "onecar";
$DB_USER = "root";
$DB_PASS = ""; // default XAMPP password is empty

function getDbConnection() {
    global $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS;
    try {
        $conn = new PDO(
            "mysql:host=$DB_HOST;dbname=$DB_NAME;charset=utf8mb4",
            $DB_USER,
            $DB_PASS
        );
        $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $conn;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database connection failed: " . $e->getMessage()]);
        exit();
    }
}
