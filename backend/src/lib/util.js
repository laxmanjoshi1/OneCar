const crypto = require('crypto');

const text = v => (typeof v === 'string' ? v.trim() : '');
const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 254;
const round2 = n => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const ref = prefix => `${prefix}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;

/**
 * Indian mobile numbers: 10 digits starting 6-9, optionally prefixed with +91 / 91 / 0.
 * Returns the canonical "+91XXXXXXXXXX" form, or null if invalid.
 */
function normalizeIndianPhone(input) {
  const digits = String(input ?? '').replace(/[\s\-().]/g, '');
  if (!/^\+?\d+$/.test(digits)) return null;
  let d = digits.replace(/^\+/, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

/** Indian vehicle registration, e.g. MH02AB1234, DL1CAB1234, KA01A1234, 22BH1234AA (Bharat series). */
function normalizeRegistration(input) {
  const v = String(input ?? '').replace(/[\s-]/g, '').toUpperCase();
  if (!v) return '';
  const state = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;
  const bh = /^\d{2}BH\d{4}[A-Z]{1,2}$/;
  return state.test(v) || bh.test(v) ? v : null;
}

/** Parse a date (YYYY-MM-DD) and time (HH:MM) entered in India Standard Time into a Date. */
function parseIST(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const d = new Date(`${date}T${time}:00+05:30`);
  if (!Number.isFinite(d.getTime())) return null;
  // Reject rolled-over dates such as 2026-02-31.
  const back = new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString();
  return back.startsWith(`${date}T${time}`) ? d : null;
}

const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const httpError = (status, message) => Object.assign(new Error(message), { status });

module.exports = { text, validEmail, round2, ref, normalizeIndianPhone, normalizeRegistration, parseIST, asyncRoute, httpError };

/** Tiny in-process keyed mutex (serialises check-then-write sequences on a single API instance). */
const tails = new Map();
async function withLock(key, fn) {
  const prev = tails.get(key) || Promise.resolve();
  let release;
  const next = new Promise(r => (release = r));
  const tail = prev.then(() => next);
  tails.set(key, tail);
  await prev;
  try { return await fn(); }
  finally { release(); if (tails.get(key) === tail) tails.delete(key); }
}
module.exports.withLock = withLock;
