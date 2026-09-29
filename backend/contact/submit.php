<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$message = trim($input['message'] ?? '');

if (empty($name) || empty($email) || empty($message)) {
    jsonResponse(false, "Name, email, and message are required.", null, 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, "Invalid email address.", null, 400);
}

$conn = getDbConnection();
$stmt = $conn->prepare(
    "INSERT INTO contact_messages (name, email, phone, message) VALUES (:name, :email, :phone, :message)"
);
$stmt->execute(['name' => $name, 'email' => $email, 'phone' => $phone, 'message' => $message]);

jsonResponse(true, "Thank you! Your message has been sent.");
