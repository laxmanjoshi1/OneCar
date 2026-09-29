<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

requireAdminAuth();

$conn = getDbConnection();
$stmt = $conn->query(
    "SELECT id, name, brand, vehicle_type, seats, price_per_km, image_url, availability_status
     FROM vehicles ORDER BY id ASC"
);
$vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Vehicles fetched successfully.", $vehicles);
