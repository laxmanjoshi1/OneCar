const crypto = require('crypto');

const keyId = () => process.env.RAZORPAY_KEY_ID || '';
const keySecret = () => process.env.RAZORPAY_KEY_SECRET || '';
const enabled = () => Boolean(keyId() && keySecret());

/** Create a Razorpay order. `amountRupees` is converted to paise. */
async function createOrder(amountRupees, receipt) {
  const auth = Buffer.from(`${keyId()}:${keySecret()}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` },
    body: JSON.stringify({ amount: Math.round(amountRupees * 100), currency: 'INR', receipt })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body?.error?.description || 'Payment gateway error.'), { status: 502 });
  return body;
}

/** Verify the checkout signature: HMAC_SHA256(order_id|payment_id, key_secret). Timing-safe. */
function verifySignature(orderId, paymentId, signature, secret = keySecret()) {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
  const a = Buffer.from(expected), b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { enabled, keyId, createOrder, verifySignature };
