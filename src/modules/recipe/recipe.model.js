import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  prepTime: { type: Number, required: true },
  cookTime: { type: Number, required: true },
  servings: { type: Number, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  ingredients: [ingredientSchema],
  instructions: { type: [String], required: true },
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: String },
    carbs: { type: String },
    fat: { type: String },
  },
}, { timestamps: true, versionKey: false });

// Compound index — covers the common query pattern: user's recipes sorted by newest
recipeSchema.index({ createdBy: 1, createdAt: -1 });

export const Recipe = mongoose.model('Recipe', recipeSchema);
