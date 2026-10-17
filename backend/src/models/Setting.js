const mongoose = require('mongoose');
const schema = new mongoose.Schema({ key: { type: String, unique: true, required: true }, value: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Setting = mongoose.model('Setting', schema);

async function getCommissionPercent() {
  const row = await Setting.findOne({ key: 'commission_percent' }).lean();
  const v = Number(row?.value ?? process.env.COMMISSION_PERCENT ?? 15);
  return Number.isFinite(v) ? Math.min(50, Math.max(0, v)) : 15;
}
async function setCommissionPercent(v) {
  await Setting.updateOne({ key: 'commission_percent' }, { $set: { value: v } }, { upsert: true });
}
module.exports = { Setting, getCommissionPercent, setCommissionPercent };
