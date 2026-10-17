const Vehicle = require('../models/Vehicle');
const { calcFare } = require('./fare');
const { httpError } = require('./util');

// The category's public price is the one set by its cheapest active vehicle (lowest per-km rate, then base fare).
// The same rule is used for the rate card the website shows and for the fare the server charges.
const cheaper = (a, b) => !a || b.per_km < a.per_km || (b.per_km === a.per_km && b.base_fare < a.base_fare) ? b : a;

async function quoteFor(category, rideType, km) {
  const vehicles = await Vehicle.find({ category, active: true }).lean();
  if (!vehicles.length) throw httpError(409, 'No active vehicle is available in this category.');
  const rule = vehicles.reduce(cheaper, null);
  return { fare: calcFare(rule, rideType, km), rule, fleetSize: vehicles.length };
}

async function rateCard() {
  const picked = {};
  for (const v of await Vehicle.find({ active: true }).lean()) picked[v.category] = cheaper(picked[v.category], v);
  return Object.fromEntries(Object.entries(picked).map(([cat, v]) => [cat, { base: v.base_fare, perKm: v.per_km, airport_surcharge: v.airport_surcharge, outstation_surcharge: v.outstation_surcharge, multiplier: 1, seats: v.passengers }]));
}
module.exports = { quoteFor, rateCard };
