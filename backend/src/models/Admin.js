const mongoose = require('mongoose');
const jsonId = require('./plugins');
const schema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin'], default: 'admin' },
  active: { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
schema.plugin(jsonId);
module.exports = mongoose.model('Admin', schema);
