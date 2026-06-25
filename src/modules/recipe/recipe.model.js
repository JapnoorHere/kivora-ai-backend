import mongoose from 'mongoose';

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: String, required: true },
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  prepTime: {
    type: Number,
    required: true,
  },
  cookTime: {
    type: Number,
    required: true,
  },
  servings: {
    type: Number,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true,
  },
  ingredients: [ingredientSchema],
  instructions: {
    type: [String],
    required: true,
  },
  nutritionalInfo: {
    calories: { type: Number },
    protein: { type: String },
    carbs: { type: String },
    fat: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Recipe = mongoose.model('Recipe', recipeSchema);
