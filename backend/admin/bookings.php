<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

requireAdminAuth();

$conn = getDbConnection();
$stmt = $conn->query(
    "SELECT b.id, b.pickup_location, b.destination, b.booking_date, b.booking_time,
            b.passengers, b.special_request, b.contact_phone, b.status, b.created_at,
            u.full_name AS customer_name, u.email AS customer_email,
            v.name AS vehicle_name, v.vehicle_type,
            d.name AS driver_name
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     LEFT JOIN drivers d ON b.driver_id = d.id
     ORDER BY b.created_at DESC"
);
$bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Bookings fetched successfully.", $bookings);
