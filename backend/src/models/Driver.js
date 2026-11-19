const mongoose = require('mongoose');
const jsonId = require('./plugins');
const schema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, unique: true },                 // canonical +91XXXXXXXXXX
  license_number: { type: String, uppercase: true, trim: true, maxlength: 20 },
  city: { type: String, trim: true, maxlength: 80 },
  notes: { type: String, trim: true, maxlength: 500 },
  active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
schema.plugin(jsonId);
module.exports = mongoose.model('Driver', schema);
