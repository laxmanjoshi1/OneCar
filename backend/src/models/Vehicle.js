const mongoose = require('mongoose');
const jsonId = require('./plugins');
const { CATEGORIES } = require('../lib/fare');
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, enum: CATEGORIES, required: true, index: true },
  registration_number: { type: String, uppercase: true, trim: true },   // e.g. MH02AB1234
  passengers: { type: Number, min: 1, max: 20, default: 3 },
  luggage: { type: Number, min: 0, max: 30, default: 2 },
  fuel_type: { type: String, enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'], default: 'Petrol' },
  image_url: { type: String, default: null },
  // Pricing (INR). The customer-facing fare for a category is taken from its cheapest active vehicle.
  base_fare: { type: Number, required: true, min: 0, max: 100000 },
  per_km: { type: Number, required: true, min: 0, max: 100000 },
  airport_surcharge: { type: Number, default: 0, min: 0, max: 100000 },
  outstation_surcharge: { type: Number, default: 0, min: 0, max: 100000 },
  active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
schema.index({ registration_number: 1 }, { unique: true, partialFilterExpression: { registration_number: { $type: 'string' } } });
schema.plugin(jsonId);
module.exports = mongoose.model('Vehicle', schema);
