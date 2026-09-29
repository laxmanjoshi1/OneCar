<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

$userId = requireUserAuth();

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT id, full_name, email, phone, created_at FROM users WHERE id = :id");
$stmt->execute(['id' => $userId]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    jsonResponse(false, "User not found.", null, 404);
}

jsonResponse(true, "Profile fetched successfully.", $user);
