// Creates the administrator (from ADMIN_* env vars) and a starter fleet if the fleet is empty. Safe to re-run.
require('dotenv').config();
const { execFileSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Vehicle = require('../src/models/Vehicle');

const fleet = [
  { name: 'Maruti Suzuki Dzire', category: 'Comfort Sedan', registration_number: 'MH02AB1001', passengers: 3, luggage: 2, fuel_type: 'CNG', base_fare: 100, per_km: 40, airport_surcharge: 250, outstation_surcharge: 850, image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Toyota Innova Crysta', category: 'Premium SUV', registration_number: 'MH02AB1002', passengers: 5, luggage: 4, fuel_type: 'Diesel', base_fare: 180, per_km: 58, airport_surcharge: 300, outstation_surcharge: 1000, image_url: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=900&q=80' },
  { name: 'Mercedes-Benz E-Class', category: 'Executive Class', registration_number: 'MH02AB1003', passengers: 3, luggage: 2, fuel_type: 'Petrol', base_fare: 300, per_km: 80, airport_surcharge: 350, outstation_surcharge: 1200, image_url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=900&q=80' }
];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/onecar');
  await Vehicle.init();
  if (await Vehicle.countDocuments() === 0) { await Vehicle.insertMany(fleet); console.log(`Added ${fleet.length} starter vehicles (edit or delete them in Admin → Vehicles).`); }
  else console.log('Fleet already has vehicles; skipped.');
  await mongoose.disconnect();
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) execFileSync(process.execPath, [path.join(__dirname, 'create-admin.js')], { stdio: 'inherit' });
  else console.log('ADMIN_EMAIL / ADMIN_PASSWORD not set — run `npm run create-admin` after setting them.');
})().catch(e => { console.error(e.message); process.exit(1); });
