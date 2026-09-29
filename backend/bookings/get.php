<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

$userId = requireUserAuth();

$conn = getDbConnection();
$stmt = $conn->prepare(
    "SELECT b.id, b.pickup_location, b.destination, b.booking_date, b.booking_time,
            b.passengers, b.special_request, b.contact_phone, b.status, b.created_at,
            v.name AS vehicle_name, v.vehicle_type, v.brand, v.price_per_km,
            d.name AS driver_name, d.phone AS driver_phone
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN drivers d ON b.driver_id = d.id
     WHERE b.user_id = :user_id
     ORDER BY b.booking_date DESC, b.booking_time DESC"
);
$stmt->execute(['user_id' => $userId]);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Bookings fetched successfully.", $bookings);
