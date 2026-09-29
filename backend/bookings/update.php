<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

// Only admins can change a booking's status
requireAdminAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();
$bookingId = $input['booking_id'] ?? null;
$status = $input['status'] ?? '';

$validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
if (!$bookingId || !in_array($status, $validStatuses)) {
    jsonResponse(false, "Valid booking_id and status are required.", null, 400);
}

$conn = getDbConnection();
$stmt = $conn->prepare("UPDATE bookings SET status = :status WHERE id = :id");
$stmt->execute(['status' => $status, 'id' => $bookingId]);

if ($stmt->rowCount() === 0) {
    jsonResponse(false, "Booking not found or status unchanged.", null, 404);
}

jsonResponse(true, "Booking status updated successfully.");
