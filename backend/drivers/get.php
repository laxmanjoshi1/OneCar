<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

// Driver info is admin-only (contains phone/license numbers)
requireAdminAuth();

$conn = getDbConnection();
$stmt = $conn->query(
    "SELECT d.id, d.name, d.phone, d.license_number, d.availability_status,
            v.name AS vehicle_name, v.vehicle_type
     FROM drivers d
     LEFT JOIN vehicles v ON d.vehicle_id = v.id
     ORDER BY d.name ASC"
);
$drivers = $stmt->fetchAll(PDO::FETCH_ASSOC);

jsonResponse(true, "Drivers fetched successfully.", $drivers);
