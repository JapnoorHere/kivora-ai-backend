import { config } from '../../config/env.config.js';
import { logError } from '../../utils/logger.js';

const PEXELS_SEARCH_URL = 'https://api.pexels.com/v1/search';
// A Pexels lookup is a cheap, single-photo search — closer to the AI
// provider's "verify a key" round trip than to a real generation call, so it
// gets a short leash. See ai.service.js's VERIFY_TIMEOUT_MS for the precedent.
const PEXELS_TIMEOUT_MS = 8_000;

// Which src size to keep, per orientation — large for the one hero photo a
// page shows, medium for the many small ingredient thumbnails.
const SIZE_BY_ORIENTATION = {
  landscape: 'large',
  square: 'medium',
};

/**
 * One Pexels search, one photo back. Never throws:
 * - missing key / network error / timeout / non-2xx  -> `null` (treat as a
 *   transient failure — don't cache it, a later recipe will retry fresh)
 * - a successful call with zero results               -> `{ found: false }`
 *   (a durable fact about Pexels' corpus — the caller *does* cache this)
 * - a successful call with a hit                       -> `{ found: true, ... }`
 */
export const searchPexelsPhoto = async (searchTerm, orientation) => {
  if (!config.pexels.apiKey) return null;

  try {
    const url = new URL(PEXELS_SEARCH_URL);
    url.searchParams.set('query', searchTerm);
    url.searchParams.set('per_page', '1');
    url.searchParams.set('orientation', orientation);

    const response = await fetch(url, {
      headers: { Authorization: config.pexels.apiKey },
      signal: AbortSignal.timeout(PEXELS_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      logError(`Pexels search failed (${response.status}) for "${searchTerm}": ${body.slice(0, 300)}`);
      return null;
    }

    const data = await response.json();
    const photo = data.photos?.[0];
    if (!photo) {
      return { found: false };
    }

    const sizeKey = SIZE_BY_ORIENTATION[orientation] || 'medium';
    return {
      found: true,
      photoUrl: photo.src?.[sizeKey] || photo.src?.medium || photo.src?.original || null,
      pexelsPhotoPageUrl: photo.url || 'https://www.pexels.com',
      photographerName: photo.photographer || null,
      photographerUrl: photo.photographer_url || null,
      pexelsId: photo.id || null,
    };
  } catch (error) {
    logError(`Pexels search error for "${searchTerm}"`, error);
    return null;
  }
};
