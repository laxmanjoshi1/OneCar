<?php
require_once __DIR__ . '/../utils/helpers.php';
require_once __DIR__ . '/../config/database.php';
applyCors();

requireAdminAuth();

$conn = getDbConnection();

$totalUsers = $conn->query("SELECT COUNT(*) FROM users")->fetchColumn();
$totalBookings = $conn->query("SELECT COUNT(*) FROM bookings")->fetchColumn();
$pendingBookings = $conn->query("SELECT COUNT(*) FROM bookings WHERE status = 'pending'")->fetchColumn();
$confirmedBookings = $conn->query("SELECT COUNT(*) FROM bookings WHERE status = 'confirmed'")->fetchColumn();
$completedBookings = $conn->query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'")->fetchColumn();
$cancelledBookings = $conn->query("SELECT COUNT(*) FROM bookings WHERE status = 'cancelled'")->fetchColumn();
$totalVehicles = $conn->query("SELECT COUNT(*) FROM vehicles")->fetchColumn();
$totalDrivers = $conn->query("SELECT COUNT(*) FROM drivers")->fetchColumn();
$newMessages = $conn->query("SELECT COUNT(*) FROM contact_messages")->fetchColumn();

jsonResponse(true, "Dashboard stats fetched.", [
    'total_users' => (int)$totalUsers,
    'total_bookings' => (int)$totalBookings,
    'pending_bookings' => (int)$pendingBookings,
    'confirmed_bookings' => (int)$confirmedBookings,
    'completed_bookings' => (int)$completedBookings,
    'cancelled_bookings' => (int)$cancelledBookings,
    'total_vehicles' => (int)$totalVehicles,
    'total_drivers' => (int)$totalDrivers,
    'contact_messages' => (int)$newMessages
]);
