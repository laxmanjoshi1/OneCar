<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();
startSecureSession();

if (isset($_SESSION['user_id'])) {
    $conn = getDbConnection();
    $stmt = $conn->prepare("SELECT id, full_name, email, phone FROM users WHERE id = :id");
    $stmt->execute(['id' => $_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($user) {
        jsonResponse(true, "Session active.", ['type' => 'user', 'user' => $user]);
    }
}

if (isset($_SESSION['admin_id'])) {
    jsonResponse(true, "Session active.", ['type' => 'admin', 'admin_id' => $_SESSION['admin_id']]);
}

jsonResponse(false, "No active session.", null, 401);
