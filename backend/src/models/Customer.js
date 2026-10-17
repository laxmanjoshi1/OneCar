const mongoose = require('mongoose');
const jsonId = require('./plugins');
const schema = new mongoose.Schema({
  full_name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, unique: true },            // canonical +91XXXXXXXXXX
  email: { type: String, lowercase: true, trim: true },
  password_hash: { type: String, select: false }                    // absent for guest customers
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });
// Unique only when an email is actually present (guests may have none).
schema.index({ email: 1 }, { unique: true, partialFilterExpression: { email: { $type: 'string' } } });
schema.plugin(jsonId);
module.exports = mongoose.model('Customer', schema);
