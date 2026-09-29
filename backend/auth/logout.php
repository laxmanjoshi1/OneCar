<?php
require_once __DIR__ . '/../utils/helpers.php';
applyCors();
startSecureSession();

$_SESSION = [];
session_destroy();

jsonResponse(true, "Logged out successfully.");
