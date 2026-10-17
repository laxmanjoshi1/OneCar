const router = require('express').Router();
const bcrypt = require('bcryptjs');
const Customer = require('../models/Customer');
const Booking = require('../models/Booking');
const { text, validEmail, normalizeIndianPhone, asyncRoute } = require('../lib/util');
const { ok, fail, requireCustomer } = require('../middleware/auth');

const regenerate = req => new Promise((resolve, reject) => req.session.regenerate(e => (e ? reject(e) : resolve())));
const sessionUser = c => ({ id: String(c._id), name: c.full_name, email: c.email, phone: c.phone });
const cookieOpts = () => { const p = process.env.NODE_ENV === 'production'; return { httpOnly: true, secure: p, sameSite: p ? 'none' : 'lax' }; };

router.post('/register', asyncRoute(async (req, res) => {
  const name = text(req.body.full_name || req.body.name), email = text(req.body.email).toLowerCase();
  const phone = normalizeIndianPhone(req.body.phone), password = req.body.password;
  if (name.length < 2 || name.length > 120 || !validEmail(email) || !phone) return fail(res, 'Enter a valid name, email and 10-digit Indian mobile number.', 422);
  if (typeof password !== 'string' || password.length < 10 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return fail(res, 'Password must be 10–128 characters with at least one letter and one number.', 422);

  const hash = await bcrypt.hash(password, 12);
  const byPhone = await Customer.findOne({ phone }).select('+password_hash');
  const byEmail = await Customer.findOne({ email }).select('+password_hash');
  if ((byPhone && byPhone.password_hash) || (byEmail && byEmail.password_hash)) return fail(res, 'An account already exists with this phone or email. Please sign in.', 409);
  if (byEmail && byPhone && String(byEmail._id) !== String(byPhone._id)) return fail(res, 'This email belongs to a different customer profile.', 409);

  // A guest profile (from an earlier booking) becomes an account only when the phone matches.
  let customer = byPhone || null;
  if (byEmail && !byPhone) return fail(res, 'This email is already linked to a customer profile. Use the phone number you booked with.', 409);
  if (customer) { customer.full_name = name; customer.email = email; customer.password_hash = hash; await customer.save(); }
  else customer = await Customer.create({ full_name: name, phone, email, password_hash: hash });

  await regenerate(req);
  req.session.customer = sessionUser(customer);
  ok(res, req.session.customer, 201);
}));

router.post('/login', asyncRoute(async (req, res) => {
  const email = text(req.body.email).toLowerCase(), password = req.body.password;
  if (!validEmail(email) || typeof password !== 'string') return fail(res, 'Enter a valid email and password.', 422);
  const user = await Customer.findOne({ email }).select('+password_hash');
  if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) return fail(res, 'Invalid email or password.', 401);
  await regenerate(req);
  req.session.customer = sessionUser(user);
  ok(res, req.session.customer);
}));

router.get('/me', (req, res) => (req.session?.customer ? ok(res, req.session.customer) : fail(res, 'Not logged in.', 401)));
router.post('/logout', (req, res) => req.session.destroy(() => { res.clearCookie('onecar.sid', cookieOpts()); res.json({ message: 'Signed out.' }); }));

// The signed-in customer's own bookings.
router.get('/bookings', requireCustomer, asyncRoute(async (req, res) => {
  ok(res, await Booking.find({ customer: req.session.customer.id }).sort({ created_at: -1 }).limit(100));
}));

module.exports = router;
module.exports.cookieOpts = cookieOpts;
