import mongoose from 'mongoose';

// One row per error that reaches the global error handler. `source` is the
// answer to "was this our bug, the AI provider, or expected user/input behavior?"
const errorLogSchema = new mongoose.Schema({
  requestId: { type: String, default: null, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  statusCode: { type: Number, required: true },
  code: { type: String, default: null },
  message: { type: String, required: true },
  source: { type: String, enum: ['server', 'ai_provider', 'expected'], required: true, index: true },
  // Only populated for source: 'server' — unexpected bugs are the ones worth a stack trace
  stack: { type: String, default: null },
}, { timestamps: true, versionKey: false });

errorLogSchema.index({ createdAt: -1 });

export const ErrorLog = mongoose.model('ErrorLog', errorLogSchema);
