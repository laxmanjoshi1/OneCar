<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

$userId = requireUserAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method", null, 405);
}

$input = getJsonInput();

$vehicleId = $input['vehicle_id'] ?? null;
$pickup = trim($input['pickup_location'] ?? '');
$destination = trim($input['destination'] ?? '');
$date = trim($input['booking_date'] ?? '');
$time = trim($input['booking_time'] ?? '');
$passengers = intval($input['passengers'] ?? 0);
$specialRequest = trim($input['special_request'] ?? '');
$contactPhone = trim($input['contact_phone'] ?? '');

// Validation
if (!$vehicleId || empty($pickup) || empty($destination) || empty($date) || empty($time) || empty($contactPhone)) {
    jsonResponse(false, "Please fill in all required booking fields.", null, 400);
}
if ($passengers < 1 || $passengers > 20) {
    jsonResponse(false, "Passenger count must be between 1 and 20.", null, 400);
}
$dateObj = DateTime::createFromFormat('Y-m-d', $date);
if (!$dateObj) {
    jsonResponse(false, "Invalid date format.", null, 400);
}

$conn = getDbConnection();

// Confirm vehicle exists and is available
$stmt = $conn->prepare("SELECT id, availability_status FROM vehicles WHERE id = :id");
$stmt->execute(['id' => $vehicleId]);
$vehicle = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$vehicle) {
    jsonResponse(false, "Selected vehicle does not exist.", null, 404);
}
if ($vehicle['availability_status'] !== 'available') {
    jsonResponse(false, "Selected vehicle is currently unavailable.", null, 409);
}

$stmt = $conn->prepare(
    "INSERT INTO bookings (user_id, vehicle_id, pickup_location, destination, booking_date, booking_time, passengers, special_request, contact_phone, status)
     VALUES (:user_id, :vehicle_id, :pickup, :destination, :date, :time, :passengers, :special_request, :contact_phone, 'pending')"
);
$stmt->execute([
    'user_id' => $userId,
    'vehicle_id' => $vehicleId,
    'pickup' => $pickup,
    'destination' => $destination,
    'date' => $date,
    'time' => $time,
    'passengers' => $passengers,
    'special_request' => $specialRequest,
    'contact_phone' => $contactPhone
]);

$bookingId = $conn->lastInsertId();

jsonResponse(true, "Booking created successfully.", ['booking_id' => $bookingId]);
