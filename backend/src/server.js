require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || '';
if (isProd && (sessionSecret.length < 32 || /replace|example|change-this/i.test(sessionSecret))) throw new Error('SESSION_SECRET must be a unique random value of at least 32 characters in production.');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onecar';
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173').split(',').map(x => x.trim()).filter(Boolean);

function buildApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin(origin, cb) { return !origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error('Origin is not allowed by CORS.')); }, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(session({
    name: 'onecar.sid', secret: sessionSecret || 'local-development-only-session-secret-change-me', resave: false, saveUninitialized: false,
    store: MongoStore.create({ client: mongoose.connection.getClient(), collectionName: 'sessions', ttl: 24 * 60 * 60 }),
    cookie: { httpOnly: true, secure: isProd, sameSite: isProd ? 'none' : 'lax', maxAge: 24 * 60 * 60 * 1000 }
  }));
  app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false }));
  app.use('/api/bookings', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false }));

  app.use('/api', require('./routes/public'));
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/bookings', require('./routes/bookings'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    let status = Number(err.status) || 500, message = err.message;
    if (err.name === 'ValidationError') { status = 422; message = Object.values(err.errors).map(e => e.message).join(' '); }
    else if (err.name === 'CastError') { status = 422; message = 'Invalid value supplied.'; }
    else if (err.code === 11000) { status = 409; message = `That ${Object.keys(err.keyPattern || {})[0]?.replace('_', ' ') || 'value'} is already in use.`; }
    else if (err.type === 'entity.parse.failed') { status = 400; message = 'Malformed JSON body.'; }
    if (status >= 500) { console.error('[OneCar API]', err); message = 'Server error. Please try again.'; }
    if (res.headersSent) return next(err);
    res.status(status).json({ message });
  });
  return app;
}

async function main() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  // Make sure unique/partial indexes exist before serving traffic.
  await Promise.all(Object.values(mongoose.models).map(m => m.init()));
  const port = Number(process.env.PORT || 5000);
  buildApp().listen(port, '0.0.0.0', () => console.log(`OneCar API listening on :${port} (MongoDB connected, online payments ${require('./lib/razorpay').enabled() ? 'ON' : 'off'})`));
}
main().catch(err => { console.error('Failed to start:', err.message); process.exit(1); });
