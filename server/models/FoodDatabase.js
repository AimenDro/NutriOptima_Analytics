const mongoose = require('mongoose');

const foodDatabaseSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  commonNames: [String], // Alternative names
  category: {
    type: String,
    required: true,
    enum: [
      'fruits', 'vegetables', 'grains', 'proteins', 'dairy', 
      'nuts_seeds', 'legumes', 'beverages', 'snacks', 'desserts',
      'oils_fats', 'herbs_spices', 'processed_foods', 'other'
    ],
    index: true
  },
  subcategory: String,
  
  // Nutritional Information (per 100g)
  nutrition: {
    calories: { type: Number, required: true },
    protein: { type: Number, required: true }, // grams
    carbs: { type: Number, required: true }, // grams
    fat: { type: Number, required: true }, // grams
    fiber: { type: Number, default: 0 }, // grams
    sugar: { type: Number, default: 0 }, // grams
    sodium: { type: Number, default: 0 }, // mg
    cholesterol: { type: Number, default: 0 }, // mg
    saturatedFat: { type: Number, default: 0 }, // grams
    transFat: { type: Number, default: 0 }, // grams
  },
  
  // Micronutrients (per 100g)
  micronutrients: {
    // Vitamins
    vitaminA_mcg: { type: Number, default: 0 },
    vitaminC_mg: { type: Number, default: 0 },
    vitaminD_mcg: { type: Number, default: 0 },
    vitaminE_mg: { type: Number, default: 0 },
    vitaminK_mcg: { type: Number, default: 0 },
    vitaminB1_mg: { type: Number, default: 0 }, // Thiamine
    vitaminB2_mg: { type: Number, default: 0 }, // Riboflavin
    vitaminB3_mg: { type: Number, default: 0 }, // Niacin
    vitaminB6_mg: { type: Number, default: 0 },
    vitaminB12_mcg: { type: Number, default: 0 },
    folate_mcg: { type: Number, default: 0 },
    
    // Minerals
    calcium_mg: { type: Number, default: 0 },
    iron_mg: { type: Number, default: 0 },
    magnesium_mg: { type: Number, default: 0 },
    phosphorus_mg: { type: Number, default: 0 },
    potassium_mg: { type: Number, default: 0 },
    zinc_mg: { type: Number, default: 0 },
    copper_mg: { type: Number, default: 0 },
    manganese_mg: { type: Number, default: 0 },
    selenium_mcg: { type: Number, default: 0 }
  },
  
  // Serving Information
  servingInfo: {
    defaultServing: { type: Number, default: 100 }, // grams
    servingUnit: { type: String, default: 'g' },
    commonServings: [{
      name: String, // e.g., "1 medium apple", "1 cup chopped"
      weight: Number // grams
    }]
  },
  
  // Health and Safety Information
  healthInfo: {
    glycemicIndex: Number,
    allergens: [String], // Common allergens
    healthBenefits: [String],
    warnings: [String], // Health warnings or contraindications
    suitableFor: [String] // Diet types: vegan, vegetarian, keto, etc.
  },
  
  // Data Quality and Sources
  dataQuality: {
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
    verifiedAt: Date,
    sources: [String], // Data sources (USDA, etc.)
    confidence: { type: Number, min: 0, max: 100, default: 50 }
  },
  
  // Admin Information
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_review', 'rejected'],
    default: 'active',
    index: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
  
  // Usage Statistics
  usage: {
    recognitionCount: { type: Number, default: 0 },
    manualEntryCount: { type: Number, default: 0 },
    lastUsed: Date
  },
  
  // Search and Indexing
  searchKeywords: [String], // For better search functionality
  tags: [String]
}, {
  timestamps: true
});

// Indexes for better performance
foodDatabaseSchema.index({ name: 'text', commonNames: 'text', searchKeywords: 'text' });
foodDatabaseSchema.index({ category: 1, subcategory: 1 });
foodDatabaseSchema.index({ status: 1 });
foodDatabaseSchema.index({ 'dataQuality.verified': 1 });
foodDatabaseSchema.index({ createdAt: -1 });
foodDatabaseSchema.index({ 'usage.recognitionCount': -1 });

// Virtual for total usage
foodDatabaseSchema.virtual('totalUsage').get(function() {
  return (this.usage.recognitionCount || 0) + (this.usage.manualEntryCount || 0);
});

// Method to calculate nutrition for specific serving size
foodDatabaseSchema.methods.getNutritionForServing = function(servingGrams) {
  const factor = servingGrams / 100; // Base nutrition is per 100g
  const nutrition = {};
  
  // Scale macronutrients
  Object.keys(this.nutrition).forEach(key => {
    nutrition[key] = Math.round((this.nutrition[key] || 0) * factor * 100) / 100;
  });
  
  // Scale micronutrients
  const micronutrients = {};
  Object.keys(this.micronutrients).forEach(key => {
    micronutrients[key] = Math.round((this.micronutrients[key] || 0) * factor * 100) / 100;
  });
  
  return { nutrition, micronutrients };
};

// Static method to search foods
foodDatabaseSchema.statics.searchFoods = function(query, options = {}) {
  const {
    category,
    verified,
    status = 'active',
    limit = 20,
    skip = 0,
    sortBy = 'name',
    sortOrder = 1
  } = options;
  
  const searchQuery = { status };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (category) {
    searchQuery.category = category;
  }
  
  if (verified !== undefined) {
    searchQuery['dataQuality.verified'] = verified;
  }
  
  const sort = {};
  sort[sortBy] = sortOrder;
  
  return this.find(searchQuery)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .populate('createdBy updatedBy', 'email role')
    .populate('dataQuality.verifiedBy', 'email role');
};

const FoodDatabase = mongoose.model('FoodDatabase', foodDatabaseSchema);

module.exports = FoodDatabase;