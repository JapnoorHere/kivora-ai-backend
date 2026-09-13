import { PexelsImageCache } from './pexels-image-cache.model.js';
import { searchPexelsPhoto } from './pexels.service.js';
import { mapWithConcurrency } from '../../utils/concurrency.util.js';
import { logError } from '../../utils/logger.js';

// A handful of Pexels lookups in flight at once for a single recipe — enough
// to keep a 15-20 ingredient recipe's cache-miss latency reasonable without
// bursting too much of the hourly quota in one generation.
const FETCH_CONCURRENCY = 6;

export const normalizeSearchTerm = (term) => String(term || '').trim().toLowerCase().replace(/\s+/g, ' ');

const cacheKey = (searchTerm, orientation) => `${orientation}|${searchTerm}`;

const toResultShape = (doc) => {
  if (!doc?.found) return null;
  return {
    photoUrl: doc.photoUrl,
    pexelsPhotoPageUrl: doc.pexelsPhotoPageUrl,
    photographerName: doc.photographerName,
    photographerUrl: doc.photographerUrl,
    pexelsId: doc.pexelsId,
  };
};

/**
 * Resolves a photo for every `{ searchTerm, orientation }` pair in `requests`,
 * in one batch: a single cache read covering all of them, then Pexels calls
 * (concurrency-capped) only for whichever ones actually missed. Returns a Map
 * from `${orientation}|${searchTerm}` to a photo result object or `null`.
 */
export const resolveImages = async (requests) => {
  const results = new Map();
  if (requests.length === 0) return results;

  const cached = await PexelsImageCache.find({ $or: requests }).lean();
  const cachedKeys = new Set();
  for (const doc of cached) {
    const key = cacheKey(doc.searchTerm, doc.orientation);
    results.set(key, toResultShape(doc));
    cachedKeys.add(key);
  }

  const misses = requests.filter((r) => !cachedKeys.has(cacheKey(r.searchTerm, r.orientation)));

  await mapWithConcurrency(misses, FETCH_CONCURRENCY, async ({ searchTerm, orientation }) => {
    const key = cacheKey(searchTerm, orientation);
    const outcome = await searchPexelsPhoto(searchTerm, orientation);

    if (outcome === null) {
      // Transient failure — don't cache it, this recipe just goes without a
      // photo for this term; a future generation retries fresh.
      results.set(key, null);
      return;
    }

    results.set(key, toResultShape({ ...outcome, searchTerm, orientation }));

    // Persist either way — upsert so two recipes racing the same brand-new
    // term at once don't throw on the unique index; the loser is a no-op.
    await PexelsImageCache.findOneAndUpdate(
      { searchTerm, orientation },
      { $setOnInsert: { searchTerm, orientation, ...outcome } },
      { upsert: true },
    ).catch((error) => logError(`Failed to persist image cache entry for "${searchTerm}"`, error));
  });

  return results;
};
