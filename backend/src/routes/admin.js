const router = require('express').Router();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const Customer = require('../models/Customer');
const Vehicle = require('../models/Vehicle');
const { getCommissionPercent, setCommissionPercent } = require('../models/Setting');
const { CATEGORIES, splitFare } = require('../lib/fare');
const { text, validEmail, round2, normalizeRegistration, asyncRoute, withLock } = require('../lib/util');
const { ok, fail, requireAdmin } = require('../middleware/auth');
const { cookieOpts } = require('./auth');

const isId = v => mongoose.isValidObjectId(v) && String(v).length === 24;
const FUELS = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];

// ---- Session ---------------------------------------------------------------
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false }), asyncRoute(async (req, res) => {
  const email = text(req.body.email).toLowerCase(), password = req.body.password;
  if (!validEmail(email) || typeof password !== 'string') return fail(res, 'Enter a valid email and password.', 422);
  const user = await Admin.findOne({ email }).select('+password_hash');
  if (!user || !user.active || !(await bcrypt.compare(password, user.password_hash))) return fail(res, 'Invalid credentials.', 401);
  await new Promise((resolve, reject) => req.session.regenerate(e => (e ? reject(e) : resolve())));
  req.session.admin = { id: String(user._id), name: user.full_name, email: user.email, role: user.role };
  ok(res, req.session.admin);
}));
router.get('/me', requireAdmin, (req, res) => ok(res, req.session.admin));
router.post('/logout', requireAdmin, (req, res) => req.session.destroy(() => { res.clearCookie('onecar.sid', cookieOpts()); res.json({ message: 'Signed out.' }); }));

router.use(requireAdmin);

router.post('/password', asyncRoute(async (req, res) => {
  const { current_password: cur, new_password: next } = req.body || {};
  if (typeof cur !== 'string' || typeof next !== 'string' || next.length < 12 || next.length > 128 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) return fail(res, 'New password must be 12–128 characters with letters and numbers.', 422);
  const admin = await Admin.findById(req.session.admin.id).select('+password_hash');
  if (!admin || !(await bcrypt.compare(cur, admin.password_hash))) return fail(res, 'Current password is incorrect.', 403);
  admin.password_hash = await bcrypt.hash(next, 12); await admin.save();
  ok(res, { message: 'Password updated.' });
}));

// ---- Dashboard -------------------------------------------------------------
router.get('/dashboard', asyncRoute(async (req, res) => {
  const startOfTodayIST = (() => { const n = new Date(Date.now() + 5.5 * 3600e3); n.setUTCHours(0, 0, 0, 0); return new Date(n.getTime() - 5.5 * 3600e3); })();
  const [byStatus, money, today, vehicles, percent] = await Promise.all([
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([
      { $group: { _id: '$commission_status', commission: { $sum: '$commission_amount' }, gross: { $sum: { $cond: [{ $in: ['$status', ['confirmed', 'completed']] }, '$total_fare', 0] } } } }
    ]),
    Booking.countDocuments({ created_at: { $gte: startOfTodayIST } }),
    Vehicle.countDocuments({ active: true }),
    getCommissionPercent()
  ]);
  const n = s => byStatus.find(x => x._id === s)?.n || 0;
  const m = s => money.find(x => x._id === s) || { commission: 0, gross: 0 };
  const completedRevenue = (await Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, t: { $sum: '$total_fare' } } }]))[0]?.t || 0;
  ok(res, {
    total_bookings: byStatus.reduce((a, x) => a + x.n, 0), pending_bookings: n('pending'), confirmed_bookings: n('confirmed'),
    completed_bookings: n('completed'), rejected_bookings: n('rejected'), cancelled_bookings: n('cancelled'),
    bookings_today: today, active_vehicles: vehicles, currency: 'INR', commission_percent: percent,
    completed_revenue: completedRevenue, commission_earned: round2(m('earned').commission), commission_expected: round2(m('expected').commission)
  });
}));

// ---- Orders (bookings): accept / reject / complete / cancel ------------------
router.get('/bookings', asyncRoute(async (req, res) => {
  const q = {};
  const status = text(req.query.status);
  if (status) { if (!['pending', 'confirmed', 'rejected', 'cancelled', 'completed'].includes(status)) return fail(res, 'Invalid status filter.', 422); q.status = status; }
  ok(res, await Booking.find(q).sort({ created_at: -1 }).limit(500));
}));

async function loadBooking(req, res) {
  if (!isId(req.params.id)) { fail(res, 'Invalid booking id.', 422); return null; }
  const b = await Booking.findById(req.params.id);
  if (!b) { fail(res, 'Booking not found.', 404); return null; }
  return b;
}
const reasonOf = req => text(req.body?.reason).slice(0, 300);

router.post('/bookings/:id/accept', asyncRoute(async (req, res) => {
  const b = await loadBooking(req, res); if (!b) return;
  if (b.status !== 'pending') return fail(res, `This order is already ${b.status}.`, 409);
  if (b.payment_method === 'online' && b.payment_status !== 'paid') return fail(res, 'Online payment has not been received for this order yet.', 409);
  if (b.pickup_at.getTime() <= Date.now()) return fail(res, 'The pickup time has already passed. Reject this order instead.', 409);

  const wantedId = text(req.body?.vehicle_id);
  if (wantedId && !isId(wantedId)) return fail(res, 'Invalid vehicle.', 422);

  const accepted = await withLock('assign-vehicle', async () => {
    const fresh = await Booking.findById(b._id);
    if (!fresh || fresh.status !== 'pending') return { error: [409, 'This order was already handled.'] };
    let candidates;
    if (wantedId) {
      const v = await Vehicle.findById(wantedId);
      if (!v || !v.active || v.category !== fresh.vehicle_category) return { error: [422, `Choose an active ${fresh.vehicle_category} vehicle.`] };
      candidates = [v];
    } else candidates = await Vehicle.find({ category: fresh.vehicle_category, active: true }).sort({ created_at: 1 });
    let chosen = null;
    for (const v of candidates) {
      const busy = await Booking.exists({ vehicle: v._id, status: 'confirmed', pickup_at: { $lt: fresh.ends_at }, ends_at: { $gt: fresh.pickup_at } });
      if (!busy) { chosen = v; break; }
    }
    if (!chosen) return { error: [409, 'No free vehicle in this category for that time slot. Reject the order or free up a vehicle.'] };
    const split = splitFare(fresh.total_fare, await getCommissionPercent());
    Object.assign(fresh, { status: 'confirmed', vehicle: chosen._id, vehicle_name: chosen.name, vehicle_registration: chosen.registration_number, decided_at: new Date(), decided_by: req.session.admin.id, commission_status: 'expected', ...split });
    await fresh.save();
    return { booking: fresh };
  });
  if (accepted.error) return fail(res, accepted.error[1], accepted.error[0]);
  ok(res, accepted.booking);
}));

router.post('/bookings/:id/reject', asyncRoute(async (req, res) => {
  const b = await loadBooking(req, res); if (!b) return;
  const reason = reasonOf(req); if (reason.length < 3) return fail(res, 'Please give a short reason for rejecting (shown to the customer).', 422);
  const r = await Booking.findOneAndUpdate({ _id: b._id, status: 'pending' }, { $set: { status: 'rejected', status_reason: reason, decided_at: new Date(), decided_by: req.session.admin.id, commission_status: 'void', ...(b.payment_status === 'paid' ? { payment_status: 'refund_due' } : {}) } }, { new: true });
  if (!r) return fail(res, 'Only pending orders can be rejected.', 409);
  ok(res, r);
}));

router.post('/bookings/:id/cancel', asyncRoute(async (req, res) => {
  const b = await loadBooking(req, res); if (!b) return;
  const reason = reasonOf(req); if (reason.length < 3) return fail(res, 'Please give a short reason for cancelling.', 422);
  const r = await Booking.findOneAndUpdate({ _id: b._id, status: 'confirmed' }, { $set: { status: 'cancelled', status_reason: reason, commission_status: 'void', ...(b.payment_status === 'paid' ? { payment_status: 'refund_due' } : {}) } }, { new: true });
  if (!r) return fail(res, 'Only accepted orders can be cancelled.', 409);
  ok(res, r);
}));

router.post('/bookings/:id/complete', asyncRoute(async (req, res) => {
  const b = await loadBooking(req, res); if (!b) return;
  if (b.status !== 'confirmed') return fail(res, 'Only accepted orders can be completed.', 409);
  if (b.pickup_at.getTime() > Date.now()) return fail(res, 'This ride has not started yet.', 409);
  const split = splitFare(b.total_fare, b.commission_rate ?? await getCommissionPercent());
  const set = { status: 'completed', completed_at: new Date(), commission_status: 'earned', ...split };
  if (b.payment_method === 'cash') { set.payment_status = 'paid'; set.paid_at = new Date(); }   // cash collected by driver
  const r = await Booking.findOneAndUpdate({ _id: b._id, status: 'confirmed' }, { $set: set }, { new: true });
  if (!r) return fail(res, 'Order was updated by someone else.', 409);
  ok(res, r);
}));

// ---- Fleet -------------------------------------------------------------------
function readVehicle(body, partial = false) {
  const out = {}, errs = [];
  const num = (k, min, max, int = false) => {
    if (body[k] === undefined || body[k] === '') { if (!partial && ['base_fare', 'per_km'].includes(k)) errs.push(`${k} is required`); return; }
    const n = Number(body[k]);
    if (!Number.isFinite(n) || n < min || n > max || (int && !Number.isInteger(n))) errs.push(`${k} must be ${int ? 'a whole number ' : ''}between ${min} and ${max}`); else out[k] = n;
  };
  if (body.name !== undefined || !partial) { const v = text(body.name); if (!v || v.length > 120) errs.push('name is required (max 120 characters)'); else out.name = v; }
  if (body.category !== undefined || !partial) { const v = text(body.category); if (!CATEGORIES.includes(v)) errs.push('invalid category'); else out.category = v; }
  if (body.fuel_type !== undefined) { const v = text(body.fuel_type); if (!FUELS.includes(v)) errs.push('invalid fuel type'); else out.fuel_type = v; }
  if (body.registration_number !== undefined) {
    const raw = text(body.registration_number);
    if (!raw) out.registration_number = undefined; else { const v = normalizeRegistration(raw); if (!v) errs.push('registration number looks invalid (e.g. MH02AB1234)'); else out.registration_number = v; }
  }
  num('passengers', 1, 20, true); num('luggage', 0, 30, true);
  num('base_fare', 0, 100000); num('per_km', 0, 100000); num('airport_surcharge', 0, 100000); num('outstation_surcharge', 0, 100000);
  if (body.image_url !== undefined) { const v = text(body.image_url); if (v && !/^https:\/\//i.test(v)) errs.push('image URL must start with https://'); else out.image_url = v || null; }
  if (body.active !== undefined) out.active = Boolean(body.active);
  return { out, errs };
}

router.get('/vehicles', asyncRoute(async (req, res) => ok(res, await Vehicle.find().sort({ created_at: -1 }))));
router.post('/vehicles', asyncRoute(async (req, res) => {
  const { out, errs } = readVehicle(req.body || {});
  if (errs.length) return fail(res, `Invalid vehicle: ${errs.join('; ')}.`, 422);
  ok(res, await Vehicle.create(out), 201);
}));
router.patch('/vehicles/:id', asyncRoute(async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 'Invalid vehicle id.', 422);
  const { out, errs } = readVehicle(req.body || {}, true);
  if (errs.length) return fail(res, `Invalid vehicle: ${errs.join('; ')}.`, 422);
  const v = await Vehicle.findById(req.params.id);
  if (!v) return fail(res, 'Vehicle not found.', 404);
  if ((out.active === false || (out.category && out.category !== v.category)) && await Booking.exists({ vehicle: v._id, status: 'confirmed', ends_at: { $gt: new Date() } }))
    return fail(res, 'This vehicle has upcoming accepted orders. Cancel or complete them before deactivating or changing its category.', 409);
  v.set(out); await v.save();
  ok(res, v);
}));
router.delete('/vehicles/:id', asyncRoute(async (req, res) => {
  if (!isId(req.params.id)) return fail(res, 'Invalid vehicle id.', 422);
  if (await Booking.exists({ vehicle: req.params.id, status: 'confirmed', ends_at: { $gt: new Date() } }))
    return fail(res, 'This vehicle has upcoming accepted orders. Cancel or complete them before deleting it.', 409);
  const r = await Vehicle.findByIdAndDelete(req.params.id);
  if (!r) return fail(res, 'Vehicle not found.', 404);
  ok(res, { message: 'Vehicle deleted.' });      // past bookings keep their own vehicle name/registration snapshot
}));

// ---- Commission ---------------------------------------------------------------
router.get('/commission', asyncRoute(async (req, res) => {
  const range = text(req.query.range) || 'all';
  const now = Date.now(), match = { commission_status: { $in: ['expected', 'earned'] } };
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range];
  if (days) match.pickup_at = { $gte: new Date(now - days * 864e5) };
  else if (range === 'month') { const n = new Date(now + 5.5 * 3600e3); match.pickup_at = { $gte: new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1) - 5.5 * 3600e3) }; }
  else if (range !== 'all') return fail(res, 'Invalid range.', 422);

  const [totals, byCategory, rows, percent] = await Promise.all([
    Booking.aggregate([{ $match: match }, { $group: { _id: '$commission_status', commission: { $sum: '$commission_amount' }, gross: { $sum: '$total_fare' }, driver: { $sum: '$driver_earning' }, rides: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { ...match, commission_status: 'earned' } }, { $group: { _id: '$vehicle_category', commission: { $sum: '$commission_amount' }, gross: { $sum: '$total_fare' }, rides: { $sum: 1 } } }, { $sort: { commission: -1 } }]),
    Booking.find(match).sort({ pickup_at: -1 }).limit(500).select('booking_reference customer_name vehicle_category vehicle_name vehicle_registration pickup_at total_fare commission_rate commission_amount driver_earning commission_status status'),
    getCommissionPercent()
  ]);
  const t = s => totals.find(x => x._id === s) || { commission: 0, gross: 0, driver: 0, rides: 0 };
  ok(res, {
    range, commission_percent: percent,
    earned: { commission: round2(t('earned').commission), gross: t('earned').gross, owner_payout: round2(t('earned').driver), rides: t('earned').rides },
    expected: { commission: round2(t('expected').commission), gross: t('expected').gross, rides: t('expected').rides },
    by_category: byCategory.map(c => ({ category: c._id, commission: round2(c.commission), gross: c.gross, rides: c.rides })),
    rows
  });
}));
router.patch('/settings', asyncRoute(async (req, res) => {
  const p = Number(req.body?.commission_percent);
  if (!Number.isFinite(p) || p < 0 || p > 50) return fail(res, 'Commission must be between 0% and 50%.', 422);
  await setCommissionPercent(p);
  ok(res, { commission_percent: p, message: 'Commission rate updated. It applies to orders accepted from now on.' });
}));

// ---- Customers ------------------------------------------------------------------
router.get('/customers', asyncRoute(async (req, res) => {
  const [customers, counts] = await Promise.all([
    Customer.find().select('+password_hash').sort({ created_at: -1 }).limit(500),
    Booking.aggregate([{ $group: { _id: '$customer', bookings: { $sum: 1 }, spent: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$total_fare', 0] } } } }])
  ]);
  const map = new Map(counts.map(c => [String(c._id), c]));
  ok(res, customers.map(c => ({ ...c.toJSON(), has_account: Boolean(c.password_hash), bookings: map.get(String(c._id))?.bookings || 0, completed_spend: map.get(String(c._id))?.spent || 0 })));
}));

module.exports = router;
