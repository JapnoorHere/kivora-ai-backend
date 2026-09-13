import { resolveImages, normalizeSearchTerm } from './image-cache.service.js';
import { logError } from '../../utils/logger.js';

/**
 * Resolves a photo for the finished dish and for every ingredient of a
 * recipe about to be saved. Best-effort end to end: any failure anywhere in
 * this pipeline is logged and swallowed — a Pexels problem must never block
 * or fail a recipe generation, it just means that recipe goes without photos
 * this time (the frontend already renders a graceful letter-tile fallback).
 *
 * Prefers each ingredient's/the dish's AI-provided English search term
 * (`searchTermEn`/`dishSearchTermEn` — see ai.service.js) so search works
 * regardless of the recipe's display language; falls back to the raw
 * name/title, which only works well for English-language recipes but
 * degrades no worse than having no photo at all.
 *
 * @param {{ title: string, dishSearchTermEn?: string|null, ingredients: Array<{name:string, searchTermEn?:string|null}> }} recipeFields
 * @returns {Promise<{ photo: object|null, ingredients: Array }>}
 */
export const resolveRecipePhotos = async (recipeFields) => {
  const { title, dishSearchTermEn, ingredients } = recipeFields;

  try {
    const dishTerm = normalizeSearchTerm(dishSearchTermEn || title);
    const ingredientTerms = ingredients.map((ingredient) =>
      normalizeSearchTerm(ingredient.searchTermEn || ingredient.name),
    );

    const dishKey = dishTerm ? { searchTerm: dishTerm, orientation: 'landscape' } : null;
    const ingredientKeys = ingredientTerms.map((term) => (term ? { searchTerm: term, orientation: 'square' } : null));

    const allKeys = [dishKey, ...ingredientKeys].filter(Boolean);
    // De-dupe identical {searchTerm, orientation} pairs before hitting the cache/API —
    // repeated ingredients (or the dish sharing a word with one) collapse to one lookup.
    const uniqueKeys = Array.from(new Map(allKeys.map((k) => [`${k.orientation}|${k.searchTerm}`, k])).values());

    const results = await resolveImages(uniqueKeys);
    const get = (key) => (key ? (results.get(`${key.orientation}|${key.searchTerm}`) ?? null) : null);

    const dishPhoto = get(dishKey);
    const photo = dishPhoto
      ? {
          url: dishPhoto.photoUrl,
          photographerName: dishPhoto.photographerName,
          photographerUrl: dishPhoto.photographerUrl,
          pexelsPhotoPageUrl: dishPhoto.pexelsPhotoPageUrl,
          pexelsId: dishPhoto.pexelsId,
        }
      : null;

    const photoedIngredients = ingredients.map((ingredient, index) => {
      const result = get(ingredientKeys[index]);
      if (!result) return ingredient;
      return {
        ...ingredient,
        image: result.photoUrl,
        imageCredit: { photographerName: result.photographerName, photographerUrl: result.photographerUrl },
      };
    });

    return { photo, ingredients: photoedIngredients };
  } catch (error) {
    logError('Recipe photo resolution failed — continuing without photos', error);
    return { photo: null, ingredients };
  }
};
