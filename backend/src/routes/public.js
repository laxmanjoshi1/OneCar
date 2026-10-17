const router = require('express').Router();
const mongoose = require('mongoose');
const Vehicle = require('../models/Vehicle');
const razorpay = require('../lib/razorpay');
const { rateCard } = require('../lib/pricing');
const { asyncRoute } = require('../lib/util');
const { ok } = require('../middleware/auth');

router.get('/', (req, res) => res.json({ service: 'OneCar API', status: 'ok', currency: 'INR' }));
router.get('/health', asyncRoute(async (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ status: connected ? 'healthy' : 'degraded', service: 'OneCar API', database: connected ? 'connected' : 'disconnected', currency: 'INR' });
}));
router.get('/pricing/config', asyncRoute(async (req, res) => {
  ok(res, { currency: 'INR', vehicles: await rateCard(), online_payments: razorpay.enabled() });
}));
router.get('/vehicles', asyncRoute(async (req, res) => {
  ok(res, await Vehicle.find({ active: true }).select('name category passengers luggage fuel_type image_url').sort({ category: 1, name: 1 }));
}));
module.exports = router;
