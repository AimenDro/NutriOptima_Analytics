const ContentModeration = require('../models/ContentModeration');
const FoodRecognition = require('../models/FoodRecognition');

class ContentModerationService {
  
  /**
   * Add food image to moderation queue
   * @param {Object} params - Parameters for adding content to moderation
   * @param {string} params.userId - User ID who uploaded the content
   * @param {string} params.contentId - ID of the content (e.g., FoodRecognition ID)
   * @param {Object} params.imageData - Image metadata
   * @param {Object} params.aiResults - AI recognition results
   * @param {string} params.priority - Priority level (low, medium, high, urgent)
   */
  async addFoodImageToQueue(params) {
    try {
      const { userId, contentId, imageData, aiResults, priority = 'medium' } = params;

      // Determine if content needs moderation based on AI confidence
      const needsModeration = this.shouldModerateContent(aiResults);
      
      if (!needsModeration) {
        // Auto-approve high-confidence, appropriate content
        return { autoApproved: true, reason: 'high_confidence_ai' };
      }

      // Create moderation entry
      const moderationEntry = new ContentModeration({
        contentType: 'food_image',
        contentId,
        userId,
        status: 'pending',
        priority: this.determinePriority(aiResults, priority),
        imageData,
        aiResults,
        autoModerated: false
      });

      await moderationEntry.save();

      return { 
        success: true, 
        moderationId: moderationEntry._id,
        needsModeration: true 
      };
    } catch (error) {
      console.error('Error adding content to moderation queue:', error);
      throw error;
    }
  }

  /**
   * Add user-submitted food entry to moderation queue
   * @param {Object} params - Parameters for adding content to moderation
   */
  async addFoodEntryToQueue(params) {
    try {
      const { userId, contentId, textContent, priority = 'low' } = params;

      const moderationEntry = new ContentModeration({
        contentType: 'food_entry',
        contentId,
        userId,
        status: 'pending',
        priority,
        textContent,
        autoModerated: false
      });

      await moderationEntry.save();

      return { 
        success: true, 
        moderationId: moderationEntry._id,
        needsModeration: true 
      };
    } catch (error) {
      console.error('Error adding food entry to moderation queue:', error);
      throw error;
    }
  }

  /**
   * Determine if content should be moderated based on AI results
   * @param {Object} aiResults - AI recognition results
   * @returns {boolean} - Whether content needs manual moderation
   */
  shouldModerateContent(aiResults) {
    if (!aiResults || !aiResults.topPrediction) {
      return true; // No AI results = needs moderation
    }

    const { confidence } = aiResults.topPrediction;
    const { flaggedReasons = [] } = aiResults;

    // Auto-moderate if confidence is low
    if (confidence < 0.8) {
      return true;
    }

    // Auto-moderate if AI flagged for any reason
    if (flaggedReasons.length > 0) {
      return true;
    }

    // Auto-moderate if predictions are inconsistent
    if (aiResults.predictions && aiResults.predictions.length > 1) {
      const topTwo = aiResults.predictions.slice(0, 2);
      const confidenceDiff = topTwo[0].confidence - topTwo[1].confidence;
      if (confidenceDiff < 0.3) {
        return true; // Close predictions = uncertain
      }
    }

    return false; // High confidence, no flags = auto-approve
  }

  /**
   * Determine priority level based on AI results and other factors
   * @param {Object} aiResults - AI recognition results
   * @param {string} basePriority - Base priority level
   * @returns {string} - Determined priority level
   */
  determinePriority(aiResults, basePriority) {
    if (!aiResults) return 'high';

    const { flaggedReasons = [], topPrediction } = aiResults;

    // Urgent priority for potentially harmful content
    if (flaggedReasons.includes('inappropriate') || 
        flaggedReasons.includes('potentially_harmful')) {
      return 'urgent';
    }

    // High priority for very low confidence
    if (topPrediction && topPrediction.confidence < 0.3) {
      return 'high';
    }

    // Medium priority for low confidence
    if (topPrediction && topPrediction.confidence < 0.6) {
      return 'medium';
    }

    return basePriority;
  }

  /**
   * Auto-moderate content based on predefined rules
   * @param {string} moderationId - Moderation entry ID
   */
  async autoModerateContent(moderationId) {
    try {
      const moderationEntry = await ContentModeration.findById(moderationId);
      if (!moderationEntry) {
        throw new Error('Moderation entry not found');
      }

      const autoModerationResult = this.runAutoModerationRules(moderationEntry);
      
      if (autoModerationResult.action !== 'manual_review') {
        moderationEntry.status = autoModerationResult.action;
        moderationEntry.autoModerated = true;
        moderationEntry.autoModerationRules = autoModerationResult.rules;
        moderationEntry.moderationReason = autoModerationResult.reason;
        moderationEntry.moderatedAt = new Date();

        await moderationEntry.save();

        return { 
          success: true, 
          action: autoModerationResult.action,
          reason: autoModerationResult.reason 
        };
      }

      return { success: true, action: 'manual_review' };
    } catch (error) {
      console.error('Error in auto-moderation:', error);
      throw error;
    }
  }

  /**
   * Run auto-moderation rules on content
   * @param {Object} moderationEntry - Moderation entry
   * @returns {Object} - Auto-moderation result
   */
  runAutoModerationRules(moderationEntry) {
    const rules = [];
    let action = 'manual_review';
    let reason = '';

    // Rule 1: Very high confidence AI results
    if (moderationEntry.aiResults && 
        moderationEntry.aiResults.topPrediction && 
        moderationEntry.aiResults.topPrediction.confidence > 0.95) {
      rules.push('high_confidence_ai');
      action = 'approved';
      reason = 'Auto-approved: High AI confidence';
    }

    // Rule 2: Flagged as inappropriate
    if (moderationEntry.aiResults && 
        moderationEntry.aiResults.flaggedReasons && 
        moderationEntry.aiResults.flaggedReasons.includes('inappropriate')) {
      rules.push('inappropriate_content');
      action = 'rejected';
      reason = 'Auto-rejected: Inappropriate content detected';
    }

    // Rule 3: Very low quality image
    if (moderationEntry.qualityScore && moderationEntry.qualityScore < 20) {
      rules.push('low_quality_image');
      action = 'rejected';
      reason = 'Auto-rejected: Image quality too low';
    }

    return { action, reason, rules };
  }

  /**
   * Get moderation statistics
   * @returns {Object} - Moderation statistics
   */
  async getModerationStats() {
    try {
      const stats = await ContentModeration.aggregate([
        {
          $group: {
            _id: null,
            totalPending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            },
            totalApproved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            totalRejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            totalFlagged: {
              $sum: { $cond: [{ $eq: ['$status', 'flagged'] }, 1, 0] }
            },
            autoModerated: {
              $sum: { $cond: ['$autoModerated', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalPending: 0,
        totalApproved: 0,
        totalRejected: 0,
        totalFlagged: 0,
        autoModerated: 0
      };
    } catch (error) {
      console.error('Error getting moderation stats:', error);
      throw error;
    }
  }

  /**
   * Clean up old moderation entries
   * @param {number} daysOld - Number of days old to clean up
   */
  async cleanupOldEntries(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await ContentModeration.deleteMany({
        status: { $in: ['approved', 'rejected'] },
        moderatedAt: { $lt: cutoffDate }
      });

      return { deletedCount: result.deletedCount };
    } catch (error) {
      console.error('Error cleaning up old moderation entries:', error);
      throw error;
    }
  }
}

module.exports = new ContentModerationService();