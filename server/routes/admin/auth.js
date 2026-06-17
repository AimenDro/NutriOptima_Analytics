const express = require('express');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const AdminUser = require('../../models/AdminUser');
const AdminActionLog = require('../../models/AdminActionLog');
const { authenticateAdmin, logAdminAction } = require('../../middleware/adminAuth');

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password, mfaToken } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_CREDENTIALS', message: 'Email and password are required.' }
      });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() }).select('+mfaSecret');
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Admin account is inactive.' }
      });
    }

    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error: { code: 'ACCOUNT_LOCKED', message: 'Account is locked due to failed login attempts.' }
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      await admin.incLoginAttempts();
      
      // Log failed login attempt
      await AdminActionLog.logAction({
        adminId: admin._id,
        adminEmail: admin.email,
        action: 'admin_login',
        targetType: 'admin_user',
        targetId: admin._id,
        details: {
          reason: 'Invalid password',
          loginAttempts: admin.loginAttempts + 1
        },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        severity: 'medium',
        success: false,
        errorMessage: 'Invalid password'
      });

      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }
      });
    }

    // Check MFA if enabled
    if (admin.mfaEnabled) {
      if (!mfaToken) {
        return res.status(401).json({
          success: false,
          error: { code: 'MFA_REQUIRED', message: 'MFA token is required.' }
        });
      }

      const verified = speakeasy.totp.verify({
        secret: admin.mfaSecret,
        encoding: 'base32',
        token: mfaToken,
        window: 2
      });

      if (!verified) {
        await admin.incLoginAttempts();
        
        // Log failed MFA attempt
        await AdminActionLog.logAction({
          adminId: admin._id,
          adminEmail: admin.email,
          action: 'admin_login',
          targetType: 'admin_user',
          targetId: admin._id,
          details: {
            reason: 'Invalid MFA token',
            loginAttempts: admin.loginAttempts + 1
          },
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          severity: 'high',
          success: false,
          errorMessage: 'Invalid MFA token'
        });

        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_MFA', message: 'Invalid MFA token.' }
        });
      }
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role,
        isAdmin: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // 8 hour session for admins
    );

    // Log successful login
    await AdminActionLog.logAction({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'admin_login',
      targetType: 'admin_user',
      targetId: admin._id,
      details: {
        reason: 'Successful login',
        mfaUsed: admin.mfaEnabled
      },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      severity: 'low',
      success: true
    });

    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          mfaEnabled: admin.mfaEnabled,
          lastLogin: admin.lastLogin
        }
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGIN_ERROR', message: 'Login failed due to server error.' }
    });
  }
});

// Admin logout
router.post('/logout', authenticateAdmin, logAdminAction('admin_logout', 'admin_user'), async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'LOGOUT_ERROR', message: 'Logout failed.' }
    });
  }
});

// Get admin profile
router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const admin = await AdminUser.findById(req.admin._id).select('-passwordHash -mfaSecret');
    
    res.json({
      success: true,
      data: { admin }
    });
  } catch (error) {
    console.error('Get admin profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PROFILE_ERROR', message: 'Failed to get profile.' }
    });
  }
});

// Update admin profile
router.put('/profile', authenticateAdmin, logAdminAction('admin_edit', 'admin_user'), async (req, res) => {
  try {
    const { email, ipWhitelist } = req.body;
    const admin = req.admin;

    if (email && email !== admin.email) {
      // Check if email is already taken
      const existingAdmin = await AdminUser.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: admin._id } 
      });
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          error: { code: 'EMAIL_EXISTS', message: 'Email already in use.' }
        });
      }
      
      admin.email = email.toLowerCase();
    }

    if (ipWhitelist !== undefined) {
      admin.ipWhitelist = Array.isArray(ipWhitelist) ? ipWhitelist : [];
    }

    await admin.save();

    res.json({
      success: true,
      data: { 
        admin: {
          id: admin._id,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          ipWhitelist: admin.ipWhitelist,
          mfaEnabled: admin.mfaEnabled
        }
      },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to update profile.' }
    });
  }
});

// Change password
router.post('/change-password', authenticateAdmin, logAdminAction('admin_edit', 'admin_user'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_PASSWORDS', message: 'Current and new passwords are required.' }
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters long.' }
      });
    }

    const admin = req.admin;
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect.' }
      });
    }

    admin.passwordHash = newPassword; // Will be hashed by pre-save middleware
    await admin.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PASSWORD_ERROR', message: 'Failed to change password.' }
    });
  }
});

// Setup MFA
router.post('/setup-mfa', authenticateAdmin, async (req, res) => {
  try {
    const admin = req.admin;

    if (admin.mfaEnabled) {
      return res.status(400).json({
        success: false,
        error: { code: 'MFA_ALREADY_ENABLED', message: 'MFA is already enabled.' }
      });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `NutriOptima Admin (${admin.email})`,
      issuer: 'NutriOptima'
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Store secret temporarily (not enabled yet)
    admin.mfaSecret = secret.base32;
    await admin.save();

    res.json({
      success: true,
      data: {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
      },
      message: 'MFA setup initiated. Please verify with your authenticator app.'
    });

  } catch (error) {
    console.error('Setup MFA error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MFA_SETUP_ERROR', message: 'Failed to setup MFA.' }
    });
  }
});

// Verify and enable MFA
router.post('/verify-mfa', authenticateAdmin, logAdminAction('admin_edit', 'admin_user'), async (req, res) => {
  try {
    const { token } = req.body;
    const admin = await AdminUser.findById(req.admin._id).select('+mfaSecret');

    if (!token) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_TOKEN', message: 'MFA token is required.' }
      });
    }

    if (!admin.mfaSecret) {
      return res.status(400).json({
        success: false,
        error: { code: 'MFA_NOT_SETUP', message: 'MFA setup not initiated.' }
      });
    }

    const verified = speakeasy.totp.verify({
      secret: admin.mfaSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid MFA token.' }
      });
    }

    // Enable MFA
    admin.mfaEnabled = true;
    await admin.save();

    res.json({
      success: true,
      message: 'MFA enabled successfully'
    });

  } catch (error) {
    console.error('Verify MFA error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MFA_VERIFY_ERROR', message: 'Failed to verify MFA.' }
    });
  }
});

// Disable MFA
router.post('/disable-mfa', authenticateAdmin, logAdminAction('admin_edit', 'admin_user'), async (req, res) => {
  try {
    const { password } = req.body;
    const admin = req.admin;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: { code: 'PASSWORD_REQUIRED', message: 'Password is required to disable MFA.' }
      });
    }

    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'Invalid password.' }
      });
    }

    admin.mfaEnabled = false;
    admin.mfaSecret = undefined;
    await admin.save();

    res.json({
      success: true,
      message: 'MFA disabled successfully'
    });

  } catch (error) {
    console.error('Disable MFA error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'MFA_DISABLE_ERROR', message: 'Failed to disable MFA.' }
    });
  }
});

// Refresh token
router.post('/refresh', authenticateAdmin, async (req, res) => {
  try {
    const admin = req.admin;

    // Generate new token
    const token = jwt.sign(
      { 
        id: admin._id, 
        email: admin.email, 
        role: admin.role,
        isAdmin: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      data: { token },
      message: 'Token refreshed successfully'
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'REFRESH_ERROR', message: 'Failed to refresh token.' }
    });
  }
});

module.exports = router;