const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const AdminActionLog = require('../models/AdminActionLog');

// Middleware to authenticate admin users
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'Access denied. No token provided.' }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if this is an admin token
    if (!decoded.isAdmin) {
      return res.status(403).json({
        success: false,
        error: { code: 'NOT_ADMIN', message: 'Access denied. Admin privileges required.' }
      });
    }

    const admin = await AdminUser.findById(decoded.id).select('-mfaSecret');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { code: 'ADMIN_NOT_FOUND', message: 'Admin user not found.' }
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'ADMIN_INACTIVE', message: 'Admin account is inactive.' }
      });
    }

    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error: { code: 'ADMIN_LOCKED', message: 'Admin account is locked due to failed login attempts.' }
      });
    }

    // Check IP whitelist if configured
    if (admin.ipWhitelist && admin.ipWhitelist.length > 0) {
      const clientIP = req.ip || req.connection.remoteAddress;
      if (!admin.ipWhitelist.includes(clientIP)) {
        // Log suspicious access attempt
        await AdminActionLog.logAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: 'admin_access_denied',
          targetType: 'admin_user',
          targetId: admin._id,
          details: {
            reason: 'IP not in whitelist',
            clientIP: clientIP,
            whitelistedIPs: admin.ipWhitelist
          },
          ipAddress: clientIP,
          userAgent: req.get('User-Agent'),
          severity: 'high',
          success: false
        });

        return res.status(403).json({
          success: false,
          error: { code: 'IP_NOT_WHITELISTED', message: 'Access denied from this IP address.' }
        });
      }
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token.' }
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token expired.' }
      });
    }

    console.error('Admin authentication error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'AUTH_ERROR', message: 'Authentication error.' }
    });
  }
};

// Middleware to check admin permissions
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'Admin authentication required.' }
        });
      }

      if (!req.admin.hasPermission(permission)) {
        // Log unauthorized access attempt
        await AdminActionLog.logAction({
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          action: 'admin_access_denied',
          targetType: 'admin_user',
          targetId: req.admin._id,
          details: {
            reason: 'Insufficient permissions',
            requiredPermission: permission,
            adminRole: req.admin.role,
            adminPermissions: req.admin.permissions
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          severity: 'medium',
          success: false
        });

        return res.status(403).json({
          success: false,
          error: { 
            code: 'INSUFFICIENT_PERMISSIONS', 
            message: `Permission '${permission}' required for this action.` 
          }
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PERMISSION_ERROR', message: 'Permission check failed.' }
      });
    }
  };
};

// Middleware to check admin role
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];
  
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: { code: 'NOT_AUTHENTICATED', message: 'Admin authentication required.' }
        });
      }

      if (!roleArray.includes(req.admin.role)) {
        // Log unauthorized access attempt
        await AdminActionLog.logAction({
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          action: 'admin_access_denied',
          targetType: 'admin_user',
          targetId: req.admin._id,
          details: {
            reason: 'Insufficient role',
            requiredRoles: roleArray,
            adminRole: req.admin.role
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          severity: 'medium',
          success: false
        });

        return res.status(403).json({
          success: false,
          error: { 
            code: 'INSUFFICIENT_ROLE', 
            message: `Role '${roleArray.join(' or ')}' required for this action.` 
          }
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ROLE_ERROR', message: 'Role check failed.' }
      });
    }
  };
};

// Middleware to log admin actions
const logAdminAction = (action, targetType, options = {}) => {
  return async (req, res, next) => {
    // Store original res.json to intercept response
    const originalJson = res.json;
    
    res.json = function(data) {
      // Log the action after successful response
      if (data.success !== false) {
        const logData = {
          adminId: req.admin._id,
          adminEmail: req.admin.email,
          action: action,
          targetType: targetType,
          targetId: req.params.id || req.body.id || options.targetId,
          details: {
            requestBody: options.logBody ? req.body : undefined,
            requestParams: req.params,
            requestQuery: req.query,
            reason: req.body.reason || options.reason,
            metadata: options.metadata
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          severity: options.severity || 'medium',
          success: true
        };

        AdminActionLog.logAction(logData).catch(error => {
          console.error('Failed to log admin action:', error);
        });
      }

      // Call original json method
      originalJson.call(this, data);
    };

    next();
  };
};

// Middleware to validate MFA token
const validateMFA = async (req, res, next) => {
  try {
    if (!req.admin.mfaEnabled) {
      return next(); // MFA not enabled, skip validation
    }

    const mfaToken = req.header('X-MFA-Token');
    
    if (!mfaToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'MFA_REQUIRED', message: 'MFA token required.' }
      });
    }

    // Here you would validate the MFA token using a library like speakeasy
    // For now, we'll implement a basic validation
    const speakeasy = require('speakeasy');
    const admin = await AdminUser.findById(req.admin._id).select('+mfaSecret');
    
    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 2 // Allow 2 time steps of variance
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_MFA', message: 'Invalid MFA token.' }
      });
    }

    next();
  } catch (error) {
    console.error('MFA validation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MFA_ERROR', message: 'MFA validation failed.' }
    });
  }
};

module.exports = {
  authenticateAdmin,
  requirePermission,
  requireRole,
  logAdminAction,
  validateMFA
};