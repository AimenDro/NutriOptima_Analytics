const mongoose = require('mongoose');

const healthAlertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  alertType: {
    type: String,
    enum: ['health_condition', 'nutrient_deficiency', 'daily_limit_exceeded', 'trend_warning'],
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
    default: 'warning'
  },
  
  // For health condition alerts
  condition: {
    type: String,
    enum: ['diabetes', 'high_blood_pressure', 'heart_disease', 'high_cholesterol', 'kidney_disease']
  },
  
  // For food-related alerts
  foodName: String,
  nutrient: String,  // 'sugar', 'sodium', 'cholesterol', 'saturated_fat'
  amount: Number,
  threshold: Number,
  unit: String,
  
  // For deficiency alerts
  deficientNutrient: String,
  currentIntake: Number,
  recommendedIntake: Number,
  percentage: Number,
  daysBelow: Number,
  
  // Alert message
  message: {
    type: String,
    required: true
  },
  
  // Additional context
  details: String,
  suggestedFoods: [String],
  actionTip: String,
  
  // Status
  acknowledged: {
    type: Boolean,
    default: false
  },
  acknowledgedAt: Date,
  
  // Metadata
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for faster queries
healthAlertSchema.index({ userId: 1, createdAt: -1 });
healthAlertSchema.index({ userEmail: 1, acknowledged: 1 });
healthAlertSchema.index({ severity: 1, acknowledged: 1 });

// Method to acknowledge alert
healthAlertSchema.methods.acknowledge = function() {
  this.acknowledged = true;
  this.acknowledgedAt = new Date();
  return this.save();
};

// Static method to get active alerts for user
healthAlertSchema.statics.getActiveAlerts = function(userId) {
  return this.find({ 
    userId, 
    acknowledged: false 
  }).sort({ severity: -1, createdAt: -1 });
};

// Static method to get alerts by severity
healthAlertSchema.statics.getBySeverity = function(userId, severity) {
  return this.find({ 
    userId, 
    severity,
    acknowledged: false 
  }).sort({ createdAt: -1 });
};

const HealthAlert = mongoose.model('HealthAlert', healthAlertSchema);

module.exports = HealthAlert;
