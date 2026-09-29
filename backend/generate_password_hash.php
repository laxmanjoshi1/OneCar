<?php
// Run this in browser (http://localhost/onecar-backend/generate_password_hash.php)
// or via CLI (php generate_password_hash.php) if the sample admin/user password
// hash in onecar.sql does not verify correctly on your PHP version.
// Default demo password used below: admin123

$password = 'admin123';
echo "Hash for '$password': " . password_hash($password, PASSWORD_DEFAULT) . "\n";
echo "Copy this hash into the 'password' column of the admins/users table in phpMyAdmin.\n";
