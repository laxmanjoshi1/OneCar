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
$stmt = $conn->prepare("SELECT id, name, email, password FROM admins WHERE email = :email");
$stmt->execute(['email' => $email]);
$admin = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$admin || !password_verify($password, $admin['password'])) {
    jsonResponse(false, "Invalid admin credentials.", null, 401);
}

$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_name'] = $admin['name'];

jsonResponse(true, "Admin login successful.", ['id' => $admin['id'], 'name' => $admin['name'], 'email' => $admin['email']]);
