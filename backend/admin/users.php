<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

requireAdminAuth();

$conn = getDbConnection();
$stmt = $conn->query(
    "SELECT id, full_name, email, phone, created_at,
            (SELECT COUNT(*) FROM bookings b WHERE b.user_id = users.id) AS total_bookings
     FROM users ORDER BY created_at DESC"
);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Users fetched successfully.", $users);
