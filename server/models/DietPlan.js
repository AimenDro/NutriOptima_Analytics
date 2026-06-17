const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: String,
  foods: [{
    name: String,
    portion: Number,
    unit: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    cuisine: String
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFat: Number,
  totalFiber: Number
});

const dietPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false  // Allow guest users
  },
  userEmail: {
    type: String,
    required: false  // Allow guest users
  },
  planType: {
    type: String,
    enum: ['daily', 'weekly'],
    default: 'daily'
  },
  meals: {
    breakfast: mealSchema,
    lunch: mealSchema,
    dinner: mealSchema,
    snack: mealSchema
  },
  dailyTotals: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  targets: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  adherence: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  source: String,
  cuisinePreference: String,
  planName: String,
  planNumber: Number,
  alerts: [{
    type: String,
    message: String,
    icon: String
  }],
  nlpAdvice: mongoose.Schema.Types.Mixed,
  advancedRecommendations: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Index for faster user lookups
dietPlanSchema.index({ userId: 1 });
dietPlanSchema.index({ userEmail: 1 });
dietPlanSchema.index({ createdAt: -1 });

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

module.exports = DietPlan;
