<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();
startSecureSession();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonResponse(false, "Email and password are required.", null, 400);
}

$conn = getDbConnection();
$stmt = $conn->prepare("SELECT id, full_name, email, phone, password FROM users WHERE email = :email");
$stmt->execute(['email' => $email]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password'])) {
    jsonResponse(false, "Invalid email or password.", null, 401);
}

$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['full_name'];

unset($user['password']);

jsonResponse(true, "Login successful.", $user);
