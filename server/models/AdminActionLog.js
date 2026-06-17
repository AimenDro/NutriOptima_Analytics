const mongoose = require('mongoose');

const adminActionLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: true
  },
  adminEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      // User management actions
      'user_view', 'user_edit', 'user_create', 'user_delete', 'user_block', 'user_unblock',
      'user_password_reset', 'user_export',
      
      // Food database actions
      'food_create', 'food_edit', 'food_delete', 'food_approve', 'food_reject',
      'food_bulk_import', 'food_export',
      
      // Content moderation actions
      'image_approve', 'image_reject', 'content_moderate', 'report_resolve',
      
      // System management actions
      'system_config_update', 'system_backup', 'system_restore', 'system_logs_access',
      
      // Health alert actions
      'health_alert_dismiss', 'health_rule_update', 'health_report_generate',
      
      // Admin management actions
      'admin_create', 'admin_edit', 'admin_delete', 'admin_login', 'admin_logout',
      
      // Notification actions
      'notification_broadcast', 'notification_send',
      
      // Other actions
      'report_generate', 'data_export'
    ]
  },
  targetType: {
    type: String,
    required: true,
    enum: ['user', 'admin_user', 'food_item', 'health_alert', 'image', 'system_config', 
           'report', 'notification', 'backup', 'health_rule', 'issue']
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId
  },
  details: {
    before: mongoose.Schema.Types.Mixed, // State before action
    after: mongoose.Schema.Types.Mixed,  // State after action
    reason: String, // Admin's reason for action
    metadata: mongoose.Schema.Types.Mixed // Additional context
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  success: {
    type: Boolean,
    default: true
  },
  errorMessage: String
}, {
  timestamps: false // We use custom timestamp field
});

// Indexes for efficient querying
adminActionLogSchema.index({ adminId: 1, timestamp: -1 });
adminActionLogSchema.index({ action: 1, timestamp: -1 });
adminActionLogSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
adminActionLogSchema.index({ severity: 1, timestamp: -1 });
adminActionLogSchema.index({ timestamp: -1 }); // For general time-based queries
adminActionLogSchema.index({ adminEmail: 1, timestamp: -1 });

// Static method to log admin action
adminActionLogSchema.statics.logAction = async function(actionData) {
  try {
    const logEntry = new this(actionData);
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Failed to log admin action:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

// Static method to get actions by admin
adminActionLogSchema.statics.getActionsByAdmin = function(adminId, options = {}) {
  const query = { adminId };
  
  if (options.startDate || options.endDate) {
    query.timestamp = {};
    if (options.startDate) query.timestamp.$gte = new Date(options.startDate);
    if (options.endDate) query.timestamp.$lte = new Date(options.endDate);
  }
  
  if (options.action) query.action = options.action;
  if (options.targetType) query.targetType = options.targetType;
  if (options.severity) query.severity = options.severity;
  
  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100)
    .skip(options.skip || 0)
    .populate('adminId', 'email role');
};

// Static method to get recent actions
adminActionLogSchema.statics.getRecentActions = function(limit = 50) {
  return this.find()
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate('adminId', 'email role');
};

// Static method to get action statistics
adminActionLogSchema.statics.getActionStats = async function(timeframe = '24h') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '1h':
      startDate = new Date(now - 60 * 60 * 1000);
      break;
    case '24h':
      startDate = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now - 24 * 60 * 60 * 1000);
  }
  
  const pipeline = [
    { $match: { timestamp: { $gte: startDate } } },
    {
      $group: {
        _id: {
          action: '$action',
          severity: '$severity'
        },
        count: { $sum: 1 },
        lastAction: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ];
  
  return this.aggregate(pipeline);
};

// Method to get human-readable action description
adminActionLogSchema.methods.getDescription = function() {
  const actionDescriptions = {
    user_view: 'Viewed user profile',
    user_edit: 'Edited user information',
    user_block: 'Blocked user account',
    user_unblock: 'Unblocked user account',
    user_delete: 'Deleted user account',
    food_create: 'Created new food item',
    food_edit: 'Edited food item',
    food_delete: 'Deleted food item',
    image_approve: 'Approved user image',
    image_reject: 'Rejected user image',
    system_backup: 'Created system backup',
    admin_login: 'Logged into admin panel',
    admin_logout: 'Logged out of admin panel'
  };
  
  return actionDescriptions[this.action] || this.action.replace(/_/g, ' ');
};

const AdminActionLog = mongoose.model('AdminActionLog', adminActionLogSchema);

module.exports = AdminActionLog;