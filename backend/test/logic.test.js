const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { calcFare, splitFare, endsAt } = require('../src/lib/fare');
const { normalizeIndianPhone, normalizeRegistration, parseIST, withLock } = require('../src/lib/util');
const { verifySignature } = require('../src/lib/razorpay');

test('fare: base + per km + surcharge, rounded up to whole rupees', () => {
  const rule = { base_fare: 100, per_km: 40, airport_surcharge: 250, outstation_surcharge: 850 };
  assert.equal(calcFare(rule, 'City ride', 10.2), 508);   // 100 + 408
  assert.equal(calcFare(rule, 'Airport', 10), 750);
  assert.equal(calcFare(rule, 'Outstation', 100), 4950);
});
test('commission split', () => {
  assert.deepEqual(splitFare(1000, 15), { commission_rate: 15, commission_amount: 150, driver_earning: 850 });
  assert.equal(splitFare(999, 15).commission_amount, 149.85);
  assert.equal(splitFare(1000, 90).commission_rate, 50);   // capped
  assert.equal(splitFare(1000, -5).commission_amount, 0);
});
test('ends_at includes turnaround buffer', () => {
  const s = new Date('2026-11-01T10:00:00Z');
  assert.equal(endsAt(s, 30).toISOString(), '2026-11-01T11:00:00.000Z');
});
test('indian phone numbers', () => {
  for (const ok of ['9876543210', '+91 98765 43210', '09876543210', '91-9876543210', '(98765) 43210']) assert.equal(normalizeIndianPhone(ok), '+919876543210');
  for (const bad of ['1234567890', '98765', '+1 415 555 0100', 'abcdefghij', '', null]) assert.equal(normalizeIndianPhone(bad), null);
});
test('indian registration numbers', () => {
  assert.equal(normalizeRegistration('mh 02 ab 1234'), 'MH02AB1234');
  assert.equal(normalizeRegistration('DL1CAB1234'), 'DL1CAB1234');
  assert.equal(normalizeRegistration('22BH1234AA'), '22BH1234AA');
  assert.equal(normalizeRegistration('XYZ'), null);
  assert.equal(normalizeRegistration(''), '');
});
test('IST parsing', () => {
  assert.equal(parseIST('2026-11-01', '10:00').toISOString(), '2026-11-01T04:30:00.000Z');
  assert.equal(parseIST('2026-02-31', '10:00'), null);
  assert.equal(parseIST('bad', '10:00'), null);
  assert.equal(parseIST('2026-11-01', '25:00'), null);
});
test('razorpay signature verification', () => {
  const sig = crypto.createHmac('sha256', 's3cret').update('order_1|pay_1').digest('hex');
  assert.equal(verifySignature('order_1', 'pay_1', sig, 's3cret'), true);
  assert.equal(verifySignature('order_1', 'pay_2', sig, 's3cret'), false);
  assert.equal(verifySignature('order_1', 'pay_1', 'x', 's3cret'), false);
  assert.equal(verifySignature('order_1', 'pay_1', sig, ''), false);
});
test('withLock serialises critical sections', async () => {
  let running = 0, max = 0;
  const job = () => withLock('k', async () => { running++; max = Math.max(max, running); await new Promise(r => setTimeout(r, 10)); running--; });
  await Promise.all([job(), job(), job()]);
  assert.equal(max, 1);
});
