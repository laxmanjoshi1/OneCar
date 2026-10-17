require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../src/models/Admin');

(async () => {
  const name = (process.env.ADMIN_NAME || '').trim();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 12) {
    console.error('Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in backend/.env first.'); process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onecar');
  await Admin.init();
  await Admin.findOneAndUpdate({ email }, { full_name: name, email, password_hash: await bcrypt.hash(password, 12), role: 'admin', active: true }, { upsert: true, new: true, setDefaultsOnInsert: true });
  console.log(`Administrator ready: ${email}. Sign in at /admin/login, then remove ADMIN_PASSWORD from .env.`);
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
