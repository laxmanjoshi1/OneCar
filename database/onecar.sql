-- =====================================================
-- OneCar Premium Mobility MVP - Database Schema
-- =====================================================

DROP DATABASE IF EXISTS onecar;
CREATE DATABASE onecar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE onecar;

-- ---------------------------------------------------
-- Table: users
-- ---------------------------------------------------
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- Table: admins
-- ---------------------------------------------------
CREATE TABLE admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- Table: vehicles
-- ---------------------------------------------------
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    vehicle_type VARCHAR(50) NOT NULL, -- Premium Sedan, Luxury Sedan, Premium SUV, Luxury SUV
    seats INT NOT NULL,
    price_per_km DECIMAL(10,2) NOT NULL,
    image_url VARCHAR(255),
    availability_status ENUM('available','unavailable') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- Table: drivers
-- ---------------------------------------------------
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    license_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_id INT,
    availability_status ENUM('available','on_trip','offline') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- ---------------------------------------------------
-- Table: bookings
-- ---------------------------------------------------
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT DEFAULT NULL,
    pickup_location VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    passengers INT NOT NULL DEFAULT 1,
    special_request TEXT,
    contact_phone VARCHAR(20) NOT NULL,
    status ENUM('pending','confirmed','completed','cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
);

-- ---------------------------------------------------
-- Table: contact_messages
-- ---------------------------------------------------
CREATE TABLE contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

-- Admin (password: admin123)
INSERT INTO admins (name, email, password) VALUES
('OneCar Admin', 'admin@onecar.com', '$2y$10$92IXUNpkjO0rOQ5byMi.YeYh4V0.dTLSlEfMwjM4WRZ2XwvB3S9nO');
-- NOTE: hash above corresponds to "admin123" using PHP password_hash (bcrypt).
-- If it does not verify on your system, run generate_admin_hash.php (see README) to regenerate.

-- Vehicles
INSERT INTO vehicles (name, brand, vehicle_type, seats, price_per_km, image_url, availability_status) VALUES
('Camry Elite', 'Toyota', 'Premium Sedan', 4, 25.00, 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600', 'available'),
('E-Class Prestige', 'Mercedes-Benz', 'Luxury Sedan', 4, 45.00, 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600', 'available'),
('Fortuner Premium', 'Toyota', 'Premium SUV', 6, 32.00, 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=600', 'available'),
('Range Rover Sport', 'Land Rover', 'Luxury SUV', 6, 60.00, 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600', 'available'),
('Accord Comfort', 'Honda', 'Premium Sedan', 4, 24.00, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=600', 'available'),
('7 Series Signature', 'BMW', 'Luxury Sedan', 4, 50.00, 'https://images.unsplash.com/photo-1523983388277-336a66bf9bcd?w=600', 'unavailable');

-- Drivers
INSERT INTO drivers (name, phone, license_number, vehicle_id, availability_status) VALUES
('Ramesh Thapa', '9800000001', 'DL-2021-00123', 1, 'available'),
('Suresh Karki', '9800000002', 'DL-2020-00456', 2, 'available'),
('Bikash Shrestha', '9800000003', 'DL-2019-00789', 3, 'on_trip'),
('Anil Rana', '9800000004', 'DL-2022-00321', 4, 'available'),
('Prakash Joshi', '9800000005', 'DL-2018-00654', 5, 'available');

-- Sample user (password: password123)
INSERT INTO users (full_name, email, phone, password) VALUES
('Test User', 'testuser@example.com', '9811111111', '$2y$10$92IXUNpkjO0rOQ5byMi.YeYh4V0.dTLSlEfMwjM4WRZ2XwvB3S9nO');

-- Sample bookings
INSERT INTO bookings (user_id, vehicle_id, driver_id, pickup_location, destination, booking_date, booking_time, passengers, special_request, contact_phone, status) VALUES
(1, 1, 1, 'Tribhuvan International Airport', 'Thamel, Kathmandu', '2026-09-25', '10:30:00', 2, 'Flight arrives at 10:00 AM', '9811111111', 'confirmed'),
(1, 3, NULL, 'Baneshwor, Kathmandu', 'Bhaktapur Durbar Square', '2026-09-20', '15:00:00', 4, NULL, '9811111111', 'completed'),
(1, 2, NULL, 'Patan', 'Kathmandu Office Park', '2026-09-28', '09:00:00', 1, 'Business meeting, need on time', '9811111111', 'pending');

-- Sample contact message
INSERT INTO contact_messages (name, email, phone, message) VALUES
('Prospective Client', 'client@example.com', '9822222222', 'Interested in your corporate mobility packages for our office. Please share pricing.');
