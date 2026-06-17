const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  name: String,
  quantity: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fats: Number,
  fiber: Number,
  sugar: Number,
  sodium: Number,
  // Micronutrients (estimated)
  vitaminC: Number,
  vitaminA: Number,
  vitaminD: Number,
  vitaminE: Number,
  vitaminK: Number,
  vitaminB12: Number,
  calcium: Number,
  iron: Number,
  magnesium: Number,
  zinc: Number,
  imageUrl: String,
  source: {
    type: String,
    enum: ['manual', 'image_ai', 'meal_plan'],
    default: 'manual'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const waterEntrySchema = new mongoose.Schema({
  amount: Number, // in liters
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const dailyTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  dietPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan',
    required: false
  },
  date: {
    type: Date,
    required: true
  },
  // Daily Goals (from diet plan)
  goals: {
    calories: {
      type: Number,
      required: true
    },
    protein: Number,
    carbs: Number,
    fats: Number,
    water: {
      type: Number,
      required: true
    }
  },
  // Consumed Today
  consumed: {
    calories: { type: Number, default: 0 },
    protein:  { type: Number, default: 0 },
    carbs:    { type: Number, default: 0 },
    fats:     { type: Number, default: 0 },
    water:    { type: Number, default: 0 },
    fiber:    { type: Number, default: 0 },
    sugar:    { type: Number, default: 0 },
    sodium:   { type: Number, default: 0 },
    // Micronutrients
    vitaminC:  { type: Number, default: 0 },
    vitaminA:  { type: Number, default: 0 },
    vitaminD:  { type: Number, default: 0 },
    vitaminE:  { type: Number, default: 0 },
    vitaminK:  { type: Number, default: 0 },
    vitaminB12:{ type: Number, default: 0 },
    calcium:   { type: Number, default: 0 },
    iron:      { type: Number, default: 0 },
    magnesium: { type: Number, default: 0 },
    zinc:      { type: Number, default: 0 },
  },
  // Detailed Entries
  foodEntries: [foodEntrySchema],
  waterEntries: [waterEntrySchema],
  // Status
  goalAchieved: {
    calories: {
      type: Boolean,
      default: false
    },
    water: {
      type: Boolean,
      default: false
    }
  },
  warnings: [{
    type: {
      type: String,
      enum: ['calorie_deficit', 'calorie_excess', 'water_deficit', 'protein_deficit']
    },
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for faster lookups
dailyTrackingSchema.index({ userId: 1, date: 1 });
dailyTrackingSchema.index({ userEmail: 1, date: 1 });

// Method to calculate progress percentage
dailyTrackingSchema.methods.getProgress = function() {
  return {
    calories: {
      consumed: this.consumed.calories,
      goal: this.goals.calories,
      percentage: Math.round((this.consumed.calories / this.goals.calories) * 100),
      remaining: this.goals.calories - this.consumed.calories
    },
    water: {
      consumed: this.consumed.water,
      goal: this.goals.water,
      percentage: Math.round((this.consumed.water / this.goals.water) * 100),
      remaining: this.goals.water - this.consumed.water
    },
    protein: {
      consumed: this.consumed.protein,
      goal: this.goals.protein,
      percentage: this.goals.protein ? Math.round((this.consumed.protein / this.goals.protein) * 100) : 0
    },
    carbs: {
      consumed: this.consumed.carbs,
      goal: this.goals.carbs,
      percentage: this.goals.carbs ? Math.round((this.consumed.carbs / this.goals.carbs) * 100) : 0
    },
    fats: {
      consumed: this.consumed.fats,
      goal: this.goals.fats,
      percentage: this.goals.fats ? Math.round((this.consumed.fats / this.goals.fats) * 100) : 0
    }
  };
};

const DailyTracking = mongoose.model('DailyTracking', dailyTrackingSchema);

module.exports = DailyTracking;
