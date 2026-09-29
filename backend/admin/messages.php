<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

requireAdminAuth();

$conn = getDbConnection();
$stmt = $conn->query("SELECT id, name, email, phone, message, created_at FROM contact_messages ORDER BY created_at DESC");
$messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Messages fetched successfully.", $messages);
