const router = require('express').Router();
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const razorpay = require('../lib/razorpay');
const { CATEGORIES, RIDE_TYPES, endsAt } = require('../lib/fare');
const { quoteFor } = require('../lib/pricing');
const { text, validEmail, normalizeIndianPhone, parseIST, ref, asyncRoute, withLock } = require('../lib/util');
const { ok, fail } = require('../middleware/auth');

const MIN_LEAD_MS = () => Math.max(0, Number(process.env.MIN_LEAD_MINUTES ?? 30)) * 60000;

router.post('/', asyncRoute(async (req, res) => {
  const b = req.body || {};
  const name = text(b.customer_name), email = text(b.customer_email || '').toLowerCase(), phone = normalizeIndianPhone(b.customer_phone);
  const rideType = text(b.ride_type || 'City ride'), category = text(b.vehicle_category);
  const pickup = text(b.pickup_location), destination = text(b.destination);
  const km = Number(b.distance_km), minutes = Math.round(Number(b.duration_minutes));
  const coords = ['pickup_lat', 'pickup_lng', 'destination_lat', 'destination_lng'].map(k => Number(b[k]));
  const method = b.payment_method === 'online' || b.payment_method === 'demo_online' ? 'online' : b.payment_method;

  if (name.length < 2 || name.length > 120) return fail(res, 'Enter your full name.', 422);
  if (!phone) return fail(res, 'Enter a valid 10-digit Indian mobile number (e.g. 98XXXXXXXX).', 422);
  if (email && !validEmail(email)) return fail(res, 'Enter a valid email address or leave it blank.', 422);
  if (!CATEGORIES.includes(category) || !RIDE_TYPES.includes(rideType)) return fail(res, 'Select a valid ride type and vehicle category.', 422);
  if (!pickup || pickup.length > 255 || !destination || destination.length > 255 || (pickup === destination)) return fail(res, 'Pickup and destination must be different valid locations.', 422);
  const pickupAt = parseIST(text(b.pickup_date), text(b.pickup_time));
  if (!pickupAt) return fail(res, 'Choose a valid pickup date and time.', 422);
  if (pickupAt.getTime() < Date.now() + MIN_LEAD_MS()) return fail(res, `Pickup must be at least ${Math.round(MIN_LEAD_MS() / 60000)} minutes from now.`, 422);
  if (!Number.isFinite(km) || km <= 0 || km > 2000 || !Number.isFinite(minutes) || minutes < 1 || minutes > 3000 || coords.some(n => !Number.isFinite(n))) return fail(res, 'Invalid route details.', 422);
  if (coords[0] < 6 || coords[0] > 38 || coords[2] < 6 || coords[2] > 38 || coords[1] < 68 || coords[1] > 98 || coords[3] < 68 || coords[3] > 98) return fail(res, 'Pickup and destination must be within India.', 422);
  if (!['cash', 'online'].includes(method)) return fail(res, 'Unsupported payment method.', 422);
  if (method === 'online' && !razorpay.enabled()) return fail(res, 'Online payment is not available right now. Please choose cash.', 422);

  const endAt = endsAt(pickupAt, minutes);

  // Serialise availability check + insert per category so two requests can't both take the last car.
  const booking = await withLock(`book:${category}`, async () => {
    const { fare, fleetSize } = await quoteFor(category, rideType, km);
    const clashes = await Booking.countDocuments({ vehicle_category: category, status: { $in: ['pending', 'confirmed'] }, pickup_at: { $lt: endAt }, ends_at: { $gt: pickupAt } });
    if (clashes >= fleetSize) throw Object.assign(new Error('All vehicles in this category are already reserved around that time. Please choose another time or category.'), { status: 409 });

    // Customer: signed-in user, else match/create a guest profile by phone.
    let customer = null;
    const signedIn = req.customerUser || req.session?.customer;
    if (signedIn) customer = await Customer.findById(signedIn.id);
    if (!customer) customer = await Customer.findOne({ phone });
    if (customer) {
      if (!customer.password_hash) { customer.full_name = name; }
      if (email && !customer.email && !(await Customer.exists({ email }))) customer.email = email;
      await customer.save();
    } else {
      const emailTaken = email ? await Customer.exists({ email }) : null;
      customer = await Customer.create({ full_name: name, phone, email: email && !emailTaken ? email : undefined });
    }

    const bookingRef = ref('OC');
    let order = null;
    if (method === 'online') order = await razorpay.createOrder(fare, bookingRef);

    return Booking.create({
      booking_reference: bookingRef, customer: customer._id, customer_name: name, customer_phone: phone, customer_email: email || undefined,
      ride_type: rideType, vehicle_category: category, pickup_location: pickup, destination,
      pickup_lat: coords[0], pickup_lng: coords[1], destination_lat: coords[2], destination_lng: coords[3],
      distance_km: Math.round(km * 1000) / 1000, duration_minutes: minutes, pickup_at: pickupAt, ends_at: endAt,
      total_fare: fare, currency: 'INR', payment_method: method,
      payment_status: method === 'cash' ? 'pending_cash' : 'pending', razorpay_order_id: order?.id, status: 'pending'
    });
  });

  const json = booking.toJSON();
  if (method === 'online') json.razorpay = { key_id: razorpay.keyId(), order_id: booking.razorpay_order_id, amount: Math.round(booking.total_fare * 100), currency: 'INR' };
  json.storage_mode = 'mongodb';
  ok(res, json, 201);
}));

// Called by the browser after Razorpay Checkout succeeds. The signature is verified server-side.
router.post('/payment/verify', asyncRoute(async (req, res) => {
  const reference = text(req.body.booking_reference), orderId = text(req.body.razorpay_order_id), paymentId = text(req.body.razorpay_payment_id), signature = text(req.body.razorpay_signature);
  const booking = await Booking.findOne({ booking_reference: reference, razorpay_order_id: orderId });
  if (!booking) return fail(res, 'Booking not found.', 404);
  if (booking.payment_status === 'paid') return ok(res, { payment_status: 'paid' });
  if (!razorpay.verifySignature(orderId, paymentId, signature)) return fail(res, 'Payment could not be verified.', 400);
  booking.payment_status = 'paid'; booking.razorpay_payment_id = paymentId; booking.paid_at = new Date();
  await booking.save();
  ok(res, { payment_status: 'paid' });
}));

// Public: a customer checks the status of their own booking. Needs the reference AND the phone number used to book.
router.get('/track', asyncRoute(async (req, res) => {
  const reference = text(req.query.reference).toUpperCase(), phone = normalizeIndianPhone(req.query.phone);
  if (!reference || !phone) return fail(res, 'Enter your booking reference and the mobile number you booked with.', 422);
  const b = await Booking.findOne({ booking_reference: reference, customer_phone: phone });
  if (!b) return fail(res, 'No booking found with these details. Check the reference and phone number.', 404);
  ok(res, {
    booking_reference: b.booking_reference, status: b.status, status_reason: b.status_reason || null,
    ride_type: b.ride_type, vehicle_category: b.vehicle_category, pickup_location: b.pickup_location, destination: b.destination,
    pickup_at: b.pickup_at, total_fare: b.total_fare, payment_method: b.payment_method, payment_status: b.payment_status,
    vehicle_name: b.vehicle_name || null, vehicle_registration: b.vehicle_registration || null, updated_at: b.updated_at
  });
}));

module.exports = router;
