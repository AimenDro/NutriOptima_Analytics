const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required']
  },
  age: {
    type: Number,
    min: [1, 'Age must be positive'],
    max: [150, 'Age must be realistic']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    lowercase: true
  },
  height: {
    type: Number,
    min: [50, 'Height must be at least 50cm']
  },
  weight: {
    type: Number,
    min: [20, 'Weight must be at least 20kg']
  },
  allergies: [{
    type: String,
    trim: true
  }],
  activityLevel: {
    type: String,
    enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    default: 'moderate'
  },
  dietaryPreferences: [{
    type: String,
    trim: true
  }],
  healthGoals: [{
    type: String,
    trim: true
  }],
  healthConditions: [{
    type: String,
    enum: ['none', 'diabetes', 'high_blood_pressure', 'heart_disease', 'high_cholesterol', 'kidney_disease'],
    lowercase: true
  }],
  cuisinePreference: {
    type: String,
    enum: ['international', 'pakistani'],
    default: 'international'
  },
  mealsPerDay: {
    type: Number,
    min: [2, 'Minimum 2 meals per day'],
    max: [6, 'Maximum 6 meals per day'],
    default: 3
  },
  emailNotifications: {
    mealReminders:         { type: Boolean, default: true },
    waterReminders:        { type: Boolean, default: true },
    dietRecommendations:   { type: Boolean, default: true },
    dailySummary:          { type: Boolean, default: true },
    weeklySummary:         { type: Boolean, default: true },
    monthlySummary:        { type: Boolean, default: true }
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster email lookups
userSchema.index({ email: 1 });

// Virtual for BMI calculation
userSchema.virtual('bmi').get(function() {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    return (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  return null;
});

// Virtual for recommended daily water intake (in ml)
userSchema.virtual('recommendedWaterIntake').get(function() {
  if (!this.weight) {
    return 2000; // Default 2 liters
  }

  // Base calculation: 33ml per kg of body weight
  let baseIntake = this.weight * 33;

  // Activity level multiplier
  const activityMultipliers = {
    'sedentary': 1.0,
    'light': 1.1,
    'moderate': 1.2,
    'active': 1.3,
    'very_active': 1.5
  };

  const activityMultiplier = activityMultipliers[this.activityLevel] || 1.2;
  let recommendedIntake = baseIntake * activityMultiplier;

  // Gender adjustment
  if (this.gender === 'male') {
    recommendedIntake *= 1.05;
  } else if (this.gender === 'female') {
    recommendedIntake *= 0.95;
  }

  // Age adjustment
  if (this.age && this.age > 65) {
    recommendedIntake *= 0.95;
  } else if (this.age && this.age < 18) {
    recommendedIntake *= 0.9;
  }

  // Round to nearest 100ml
  recommendedIntake = Math.round(recommendedIntake / 100) * 100;

  // Ensure reasonable bounds (1.5L - 5L)
  return Math.max(1500, Math.min(5000, recommendedIntake));
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
