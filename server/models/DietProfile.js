const mongoose = require('mongoose');

const dietProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  age: Number,
  gender: String,
  weight: Number,
  height: Number,
  activityLevel: String,
  goal: String,
  healthConditions: [String],
  dietaryRestrictions: [String],
  allergens: [String],
  cuisinePreference: String,
  bmr: Number,
  tdee: Number,
  dailyCalories: Number,
  macros: {
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  }
}, {
  timestamps: true
});

// Index for faster user lookups
dietProfileSchema.index({ userId: 1 });
dietProfileSchema.index({ userEmail: 1 });

const DietProfile = mongoose.model('DietProfile', dietProfileSchema);

module.exports = DietProfile;
