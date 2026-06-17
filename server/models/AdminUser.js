const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super_admin', 'content_admin', 'support_admin', 'data_admin'],
    required: true,
    default: 'support_admin'
  },
  permissions: [{
    type: String,
    enum: [
      // User management
      'users.view', 'users.edit', 'users.delete', 'users.block',
      // Food database
      'foods.view', 'foods.edit', 'foods.create', 'foods.delete', 'foods.moderate',
      // Content moderation
      'content.moderate', 'images.moderate', 'reports.view',
      // System management
      'system.config', 'system.backup', 'system.logs', 'system.analytics',
      // Health alerts
      'health.alerts', 'health.rules', 'health.reports',
      // Admin management
      'admin.create', 'admin.edit', 'admin.delete'
    ]
  }],
  mfaEnabled: {
    type: Boolean,
    default: false
  },
  mfaSecret: {
    type: String,
    select: false // Don't include in queries by default
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockedUntil: Date,
  ipWhitelist: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
adminUserSchema.index({ email: 1 });
adminUserSchema.index({ role: 1, isActive: 1 });
adminUserSchema.index({ lastLogin: -1 });

// Virtual for checking if account is locked
adminUserSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
});

// Pre-save middleware to hash password
adminUserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
adminUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Method to increment login attempts
adminUserSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockedUntil && this.lockedUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockedUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockedUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Method to reset login attempts
adminUserSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockedUntil: 1 }
  });
};

// Method to check if admin has permission
adminUserSchema.methods.hasPermission = function(permission) {
  // Super admin has all permissions
  if (this.role === 'super_admin') return true;
  
  return this.permissions.includes(permission);
};

// Static method to get role permissions
adminUserSchema.statics.getRolePermissions = function(role) {
  const rolePermissions = {
    super_admin: [], // Super admin gets all permissions dynamically
    content_admin: [
      'users.view', 'users.edit',
      'foods.view', 'foods.edit', 'foods.create', 'foods.moderate',
      'content.moderate', 'images.moderate', 'reports.view'
    ],
    support_admin: [
      'users.view', 'users.edit', 'users.block',
      'reports.view', 'health.alerts'
    ],
    data_admin: [
      'foods.view', 'foods.edit', 'foods.create', 'foods.delete',
      'system.analytics', 'health.reports'
    ]
  };
  
  return rolePermissions[role] || [];
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;