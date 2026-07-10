import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  email: { type: String, required: true, trim: true, lowercase: true },
  message: { type: String, required: true, trim: true },
}, { timestamps: true, versionKey: false });

feedbackSchema.index({ createdBy: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);
