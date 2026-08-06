import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: { type: String, required: true },

  // Encrypted user-supplied AI provider keys (BYOK). `select: false` so they
  // never come back on a plain find() — services must opt in explicitly.
  aiSettings: {
    preferredProvider: { type: String, enum: ['gemini', 'groq'], default: 'gemini' },
    gemini: { type: String, default: null, select: false },
    groq: { type: String, default: null, select: false },
  },

  // Tracks free-tier (no personal API key) recipe generations for the current day.
  dailyUsage: {
    count: { type: Number, default: 0 },
    date: { type: String, default: null },
  },

  // One-time onboarding preferences, captured right after signup.
  preferences: {
    onboardingCompleted: { type: Boolean, default: false },
    dietaryPreference: { type: String, enum: ['veg', 'nonveg', 'vegan'], default: null },
    favoriteCuisines: { type: [String], default: [] },
    favoriteDishes: { type: [String], default: [] },
    preferredLanguage: { type: String, enum: ['en', 'hi', 'pa'], default: 'en' },
  },
}, { timestamps: true, versionKey: false });

export const User = mongoose.model('User', userSchema);
