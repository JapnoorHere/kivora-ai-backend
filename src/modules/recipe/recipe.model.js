import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true },
  // Reserved for a future thumbnail source; the client renders a letter tile when null.
  image: { type: String, default: null },
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
