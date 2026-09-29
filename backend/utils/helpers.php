<?php
// =====================================================
// Shared helpers: CORS headers, JSON responses, session
// =====================================================

function applyCors() {
    // Allow the Vite dev server to talk to the PHP API.
    header("Access-Control-Allow-Origin: http://localhost:5173");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Content-Type: application/json; charset=UTF-8");

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

function startSecureSession() {
    if (session_status() === PHP_SESSION_NONE) {
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

function jsonResponse($success, $message, $data = null, $httpCode = 200) {
    http_response_code($httpCode);
    $response = ["success" => $success, "message" => $message];
    if ($data !== null) {
        $response["data"] = $data;
    }
    echo json_encode($response);
    exit();
}

function getJsonInput() {
    $input = json_decode(file_get_contents("php://input"), true);
    return $input ?? [];
}

// Require a logged-in user (customer). Halts with 401 if not present.
function requireUserAuth() {
    startSecureSession();
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, "Unauthorized. Please log in.", null, 401);
    }
    return $_SESSION['user_id'];
}

// Require a logged-in admin. Halts with 401 if not present.
function requireAdminAuth() {
    startSecureSession();
    if (!isset($_SESSION['admin_id'])) {
        jsonResponse(false, "Unauthorized. Admin login required.", null, 401);
    }
    return $_SESSION['admin_id'];
}
