// Make JSON output friendly for the React frontend: `id` instead of `_id`, no `__v`.
module.exports = function jsonId(schema) {
  schema.set('toJSON', {
    virtuals: false,
    versionKey: false,
    transform(doc, ret) { ret.id = String(ret._id); delete ret._id; delete ret.password_hash; return ret; }
  });
};
