import mongoose from 'mongoose';

// One row per AI generate/modify attempt, success or failure — the closest thing
// this app has to a "chat log": what was asked, which provider answered, how long
// it took, and (on failure) why.
const aiInteractionLogSchema = new mongoose.Schema({
  requestId: { type: String, default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, enum: ['generate', 'modify'], required: true },
  provider: { type: String, enum: ['gemini', 'groq'], required: true },
  model: { type: String, required: true },
  usingPersonalKey: { type: Boolean, default: false },
  input: { type: mongoose.Schema.Types.Mixed, default: null },
  success: { type: Boolean, required: true },
  durationMs: { type: Number, required: true },
  // Present only when the AI responded but the result was rejected (invalid dish,
  // diet mismatch) or the call itself failed (provider_error, quota_exceeded, etc.)
  errorReason: { type: String, default: null },
  errorDetail: { type: String, default: null },
  // Truncated raw parsed response — useful for debugging a bad generation without
  // storing unbounded payloads.
  rawResponseSnippet: { type: String, default: null },
}, { timestamps: true, versionKey: false });

aiInteractionLogSchema.index({ createdAt: -1 });

export const AiInteractionLog = mongoose.model('AiInteractionLog', aiInteractionLogSchema);
