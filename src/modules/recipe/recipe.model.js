import mongoose from 'mongoose';

// Who to credit for ingredients[].image, when it's populated. A separate
// sub-schema (rather than folding onto ingredientSchema directly) so it
// cleanly defaults to null as a whole rather than an object of null fields.
const imageCreditSchema = new mongoose.Schema({
  photographerName: { type: String, default: null },
  photographerUrl: { type: String, default: null },
}, { _id: false });

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true },
  // Populated by the Pexels lookup in recipe.service.js; the client renders a
  // letter tile when null (no key configured, no match found, or a lookup error).
  image: { type: String, default: null },
  // English term used to search for `image` (see ai.service.js's searchTermEn) —
  // kept so a later modify/translate can reuse it without re-asking the AI or
  // re-spending a Pexels lookup. Never shown to the user.
  searchTermEn: { type: String, default: null },
  imageCredit: { type: imageCreditSchema, default: null },
}, { _id: false });

// The one hero photo for the finished dish. A proper sub-schema (not an inline
// object) so the whole field defaults to null rather than an object of nulls,
// same reasoning as imageCreditSchema above.
const recipePhotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  photographerName: { type: String, default: null },
  photographerUrl: { type: String, default: null },
  pexelsPhotoPageUrl: { type: String, default: null },
  pexelsId: { type: Number, default: null },
}, { _id: false });

const instructionStepSchema = new mongoose.Schema({
  stepNumber: { type: Number, required: true },
  title: { type: String, trim: true },
  instruction: { type: String, required: true },
  timeRequired: { type: String },
  // Exact ingredient names (from `ingredients[].name`) this step uses.
  ingredientsUsed: { type: [String], default: [] },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  cuisine: { type: String, trim: true },
  // What the user typed in the interview's "restrictions or special requests" field —
  // fed to the AI prompt at generation time and kept here so it's visible afterward too.
  exclusions: { type: String, trim: true, default: null },
  dietaryPreference: { type: String, enum: ['veg', 'nonveg', 'vegan'], required: true },
  language: { type: String, enum: ['en', 'hi', 'pa'], required: true, default: 'en' },
  prepTime: { type: Number, required: true },
  cookTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  ingredients: [ingredientSchema],
  instructions: { type: [instructionStepSchema], required: true },
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: String },
    carbs: { type: String },
    fat: { type: String },
  },
  // Optional prep guidance shown on the ingredients checklist.
  prepNotes: {
    beforeYouStart: { type: [String], default: [] },
    proTips: { type: [String], default: [] },
  },
  // English term used to search for `photo` — same carry-forward purpose as
  // ingredients[].searchTermEn.
  dishSearchTermEn: { type: String, default: null },
  photo: { type: recipePhotoSchema, default: null },
  // Set when this recipe was produced by modifying or translating another one — never overwritten in place
  sourceRecipeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    default: null,
  },
}, { timestamps: true, versionKey: false });

// Compound index — covers the common query pattern: user's recipes sorted by newest
recipeSchema.index({ createdBy: 1, createdAt: -1 });

export const Recipe = mongoose.model('Recipe', recipeSchema);
