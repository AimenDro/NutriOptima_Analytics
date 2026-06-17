const mongoose = require('mongoose');

const contentModerationSchema = new mongoose.Schema({
  // Content reference
  contentType: {
    type: String,
    enum: ['food_image', 'food_entry', 'user_comment', 'user_note'],
    required: true
  },
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  
  // User who submitted the content
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Moderation status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Content details for food images
  imageData: {
    originalPath: String,
    thumbnailPath: String,
    fileSize: Number,
    format: String,
    dimensions: {
      width: Number,
      height: Number
    }
  },
  
  // AI recognition results for review
  aiResults: {
    predictions: [{
      food: String,
      confidence: Number
    }],
    topPrediction: {
      food: String,
      confidence: Number
    },
    flaggedReasons: [String] // Low confidence, inappropriate content, etc.
  },
  
  // Content text for entries/comments
  textContent: {
    title: String,
    description: String,
    notes: String
  },
  
  // Moderation decision
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  moderatedAt: Date,
  moderationReason: String,
  moderationNotes: String,
  
  // Feedback to user
  userFeedback: String,
  userNotified: {
    type: Boolean,
    default: false
  },
  
  // Quality metrics
  qualityScore: {
    type: Number,
    min: 0,
    max: 100
  },
  qualityFlags: [String], // blur, poor_lighting, inappropriate, etc.
  
  // Batch processing
  batchId: String,
  
  // Auto-moderation flags
  autoModerated: {
    type: Boolean,
    default: false
  },
  autoModerationRules: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
contentModerationSchema.index({ status: 1, createdAt: -1 });
contentModerationSchema.index({ contentType: 1, status: 1 });
contentModerationSchema.index({ userId: 1 });
contentModerationSchema.index({ moderatedBy: 1 });
contentModerationSchema.index({ priority: 1, createdAt: -1 });
contentModerationSchema.index({ batchId: 1 });

// Virtual for content reference
contentModerationSchema.virtual('contentRef', {
  refPath: 'contentType',
  localField: 'contentId',
  foreignField: '_id'
});

const ContentModeration = mongoose.model('ContentModeration', contentModerationSchema);

module.exports = ContentModeration;