const CATEGORIES = ['Comfort Sedan', 'Premium SUV', 'Executive Class'];
const BUFFER_MINUTES = 30; // turnaround time between two rides of the same vehicle

/** Fare in whole rupees, always rounded up. `rule` has base_fare and per_km. */
function calcFare(rule, km) {
  return Math.ceil(Number(rule.base_fare) + Number(rule.per_km) * Number(km));
}

/** Platform commission and driver/owner share for a fare. `percent` is e.g. 15 for 15%. */
function splitFare(fare, percent) {
  const p = Math.min(50, Math.max(0, Number(percent) || 0));
  const commission = Math.round(fare * p) / 100;
  return { commission_rate: p, commission_amount: commission, driver_earning: Math.round((fare - commission) * 100) / 100 };
}

const endsAt = (pickupAt, durationMinutes) => new Date(pickupAt.getTime() + (Number(durationMinutes) + BUFFER_MINUTES) * 60000);

module.exports = { CATEGORIES, BUFFER_MINUTES, calcFare, splitFare, endsAt };
