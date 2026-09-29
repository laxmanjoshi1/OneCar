<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

$userId = requireUserAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();
$bookingId = $input['booking_id'] ?? null;

if (!$bookingId) {
    jsonResponse(false, "booking_id is required.", null, 400);
}

$conn = getDbConnection();

// Ensure the booking belongs to this user and is still pending
$stmt = $conn->prepare("SELECT status FROM bookings WHERE id = :id AND user_id = :user_id");
$stmt->execute(['id' => $bookingId, 'user_id' => $userId]);
$booking = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$booking) {
    jsonResponse(false, "Booking not found.", null, 404);
}
if ($booking['status'] !== 'pending') {
    jsonResponse(false, "Only pending bookings can be cancelled.", null, 409);
}

$stmt = $conn->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = :id");
$stmt->execute(['id' => $bookingId]);

jsonResponse(true, "Booking cancelled successfully.");
