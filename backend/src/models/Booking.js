const mongoose = require('mongoose');
const jsonId = require('./plugins');
const { CATEGORIES, RIDE_TYPES } = require('../lib/fare');
const { Schema } = mongoose;

const schema = new Schema({
  booking_reference: { type: String, required: true, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
  // Snapshot of customer details at booking time (what the admin/driver needs to see)
  customer_name: String, customer_phone: String, customer_email: String,

  ride_type: { type: String, enum: RIDE_TYPES, default: 'City ride' },
  vehicle_category: { type: String, enum: CATEGORIES, required: true },
  pickup_location: { type: String, required: true, maxlength: 255 },
  destination: { type: String, required: true, maxlength: 255 },
  pickup_lat: Number, pickup_lng: Number, destination_lat: Number, destination_lng: Number,
  distance_km: { type: Number, required: true },
  duration_minutes: { type: Number, required: true },
  pickup_at: { type: Date, required: true, index: true },
  ends_at: { type: Date, required: true },                 // pickup + duration + turnaround buffer

  total_fare: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  payment_method: { type: String, enum: ['cash', 'online'], required: true },
  payment_status: { type: String, enum: ['pending_cash', 'pending', 'paid', 'failed', 'refund_due'], required: true },
  razorpay_order_id: String, razorpay_payment_id: String, paid_at: Date,

  // Order workflow: pending -> confirmed (accepted) | rejected ; confirmed -> completed | cancelled
  status: { type: String, enum: ['pending', 'confirmed', 'rejected', 'cancelled', 'completed'], default: 'pending', index: true },
  status_reason: String,                                   // reason given for reject / cancel
  decided_at: Date, decided_by: { type: Schema.Types.ObjectId, ref: 'Admin' }, completed_at: Date,

  // Assigned on acceptance
  vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', index: true },
  vehicle_name: String, vehicle_registration: String,

  // Commission: 'expected' once accepted, 'earned' once the ride is completed, 'void' if cancelled
  commission_status: { type: String, enum: ['none', 'expected', 'earned', 'void'], default: 'none' },
  commission_rate: Number, commission_amount: { type: Number, default: 0 }, driver_earning: { type: Number, default: 0 }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

schema.index({ vehicle_category: 1, status: 1, pickup_at: 1, ends_at: 1 });
schema.index({ vehicle: 1, status: 1, pickup_at: 1, ends_at: 1 });
schema.plugin(jsonId);
module.exports = mongoose.model('Booking', schema);
