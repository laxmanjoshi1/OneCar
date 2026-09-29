// =====================================================
// Centralized API service.
// All requests go to the PHP backend running under XAMPP.
// Adjust API_BASE_URL if your XAMPP folder name differs.
// =====================================================

const API_BASE_URL = 'http://localhost/onecar-backend';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    credentials: 'include', // send PHP session cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  let data;
  try {
    data = await response.json();
  } catch (e) {
    throw new Error('Server returned an invalid response.');
  }

  if (!response.ok && !('success' in data)) {
    throw new Error(data.message || 'Something went wrong.');
  }

  return data;
}

// ---------- Auth ----------
export const registerUser = (payload) =>
  request('/auth/register.php', { method: 'POST', body: JSON.stringify(payload) });

export const loginUser = (payload) =>
  request('/auth/login.php', { method: 'POST', body: JSON.stringify(payload) });

export const logoutUser = () =>
  request('/auth/logout.php', { method: 'POST' });

export const checkSession = () =>
  request('/auth/session_check.php', { method: 'GET' });

// ---------- Admin Auth ----------
export const loginAdmin = (payload) =>
  request('/admin/login.php', { method: 'POST', body: JSON.stringify(payload) });

// ---------- Vehicles ----------
export const getVehicles = () =>
  request('/vehicles/get.php', { method: 'GET' });

// ---------- Bookings (customer) ----------
export const createBooking = (payload) =>
  request('/bookings/create.php', { method: 'POST', body: JSON.stringify(payload) });

export const getMyBookings = () =>
  request('/bookings/get.php', { method: 'GET' });

export const cancelBooking = (bookingId) =>
  request('/bookings/cancel.php', { method: 'POST', body: JSON.stringify({ booking_id: bookingId }) });

// ---------- Profile ----------
export const getProfile = () =>
  request('/users/profile.php', { method: 'GET' });

// ---------- Contact ----------
export const submitContact = (payload) =>
  request('/contact/submit.php', { method: 'POST', body: JSON.stringify(payload) });

// ---------- Admin ----------
export const getAdminDashboard = () =>
  request('/admin/dashboard.php', { method: 'GET' });

export const getAdminUsers = () =>
  request('/admin/users.php', { method: 'GET' });

export const getAdminBookings = () =>
  request('/admin/bookings.php', { method: 'GET' });

export const getAdminDrivers = () =>
  request('/admin/drivers.php', { method: 'GET' });

export const getAdminVehicles = () =>
  request('/admin/vehicles.php', { method: 'GET' });

export const getAdminMessages = () =>
  request('/admin/messages.php', { method: 'GET' });

export const updateBookingStatus = (bookingId, status) =>
  request('/bookings/update.php', { method: 'POST', body: JSON.stringify({ booking_id: bookingId, status }) });
