<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();

$fullName = trim($input['full_name'] ?? '');
$email = trim($input['email'] ?? '');
$phone = trim($input['phone'] ?? '');
$password = $input['password'] ?? '';

// Basic validation
if (empty($fullName) || empty($email) || empty($phone) || empty($password)) {
    jsonResponse(false, "All fields are required.", null, 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonResponse(false, "Invalid email address.", null, 400);
}
if (strlen($password) < 6) {
    jsonResponse(false, "Password must be at least 6 characters.", null, 400);
}
if (!preg_match('/^[0-9+\-\s]{7,20}$/', $phone)) {
    jsonResponse(false, "Invalid phone number.", null, 400);
}

$conn = getDbConnection();

// Check for existing email
$stmt = $conn->prepare("SELECT id FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);
if ($stmt->fetch()) {
    jsonResponse(false, "An account with this email already exists.", null, 409);
}

$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare(
    "INSERT INTO users (full_name, email, phone, password) VALUES (:full_name, :email, :phone, :password)"
);
$stmt->execute([
    'full_name' => $fullName,
    'email' => $email,
    'phone' => $phone,
    'password' => $hashedPassword
]);

jsonResponse(true, "Registration successful. Please log in.");
