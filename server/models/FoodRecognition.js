const mongoose = require('mongoose');

const foodRecognitionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userEmail: String,
  predictions: [{
    rank: Number,
    fruit: String,
    confidence: Number,
    percentage: Number,
    weight_grams: Number
  }],
  topPrediction: {
    rank: Number,
    fruit: String,
    confidence: Number,
    percentage: Number
  },
  nutrition: {
    calories: Number,
    carbs: Number,
    protein: Number,
    fat: Number,
    fiber: Number,
    sugar: Number
  },
  micronutrients: {
    iron_mg: Number,
    vitamin_d_mcg: Number,
    vitamin_b12_mcg: Number,
    calcium_mg: Number,
    vitamin_c_mg: Number
  },
  deficiencyRisk: String,
  healthScore: Number,
  recommendations: [String],
  modelType: String,
  dataset: String,
  imageMetadata: {
    size: Number,
    format: String,
    uploadedAt: Date,
    path: String
  }
}, {
  timestamps: true
});

// Index for faster user lookups
foodRecognitionSchema.index({ userId: 1 });
foodRecognitionSchema.index({ userEmail: 1 });
foodRecognitionSchema.index({ createdAt: -1 });

const FoodRecognition = mongoose.model('FoodRecognition', foodRecognitionSchema);

module.exports = FoodRecognition;
