import mongoose from 'mongoose';

// Denylist of session tokens killed by an explicit logout. Rows self-destruct once
// the token would have expired anyway, so the collection stays bounded without a cron.
const revokedTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true, versionKey: false });

revokedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RevokedToken = mongoose.model('RevokedToken', revokedTokenSchema);
