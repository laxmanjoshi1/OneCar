const CATEGORIES = ['Comfort Sedan', 'Premium SUV', 'Executive Class'];
const RIDE_TYPES = ['City ride', 'Airport', 'Outstation'];
const BUFFER_MINUTES = 30; // turnaround time between two rides of the same vehicle

/** Fare in whole rupees, always rounded up. `rule` has base_fare, per_km, airport_surcharge, outstation_surcharge. */
function calcFare(rule, rideType, km) {
  let surcharge = 0;
  if (rideType === 'Airport') surcharge = Number(rule.airport_surcharge) || 0;
  if (rideType === 'Outstation') surcharge = Number(rule.outstation_surcharge) || 0;
  return Math.ceil(Number(rule.base_fare) + Number(rule.per_km) * Number(km) + surcharge);
}

/** Platform commission and driver/owner share for a fare. `percent` is e.g. 15 for 15%. */
function splitFare(fare, percent) {
  const p = Math.min(50, Math.max(0, Number(percent) || 0));
  const commission = Math.round(fare * p) / 100;
  return { commission_rate: p, commission_amount: commission, driver_earning: Math.round((fare - commission) * 100) / 100 };
}

const endsAt = (pickupAt, durationMinutes) => new Date(pickupAt.getTime() + (Number(durationMinutes) + BUFFER_MINUTES) * 60000);

module.exports = { CATEGORIES, RIDE_TYPES, BUFFER_MINUTES, calcFare, splitFare, endsAt };
