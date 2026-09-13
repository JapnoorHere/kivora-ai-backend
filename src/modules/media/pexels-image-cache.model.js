import mongoose from 'mongoose';

// Durable cache of Pexels lookups, keyed by the normalized English search term
// and which shape of photo was requested (an ingredient thumbnail vs. the one
// dish hero photo need different orientations, so they're different lookups
// even for the same word). This is what keeps the app inside Pexels' rate
// limit as usage grows: a common ingredient like "onion" is looked up once,
// ever, across every user and every recipe from then on.
//
// `found: false` is cached too, deliberately — a term Pexels genuinely has no
// photos for is a durable fact worth remembering, not a transient failure.
// Only an actual error (network/timeout/5xx) is left uncached, so it's the
// one case retried on the next recipe that needs it.
const pexelsImageCacheSchema = new mongoose.Schema({
  searchTerm: { type: String, required: true, trim: true, lowercase: true },
  orientation: { type: String, enum: ['landscape', 'square'], required: true },
  found: { type: Boolean, required: true },
  photoUrl: { type: String, default: null },
  pexelsPhotoPageUrl: { type: String, default: null },
  photographerName: { type: String, default: null },
  photographerUrl: { type: String, default: null },
  pexelsId: { type: Number, default: null },
}, { timestamps: true, versionKey: false });

pexelsImageCacheSchema.index({ searchTerm: 1, orientation: 1 }, { unique: true });

export const PexelsImageCache = mongoose.model('PexelsImageCache', pexelsImageCacheSchema);
