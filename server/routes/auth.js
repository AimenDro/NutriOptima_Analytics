const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isDBConnected } = require('../config/database');
const router = express.Router();

// Middleware to check DB connection
const requireDB = (req, res, next) => {
  if (!isDBConnected()) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database connection is not available. Please check MongoDB Atlas IP whitelist or use local MongoDB.',
        details: 'Visit https://cloud.mongodb.com/ to whitelist your IP address'
      }
    });
  }
  next();
};

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Helper function to validate email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password
const isValidPassword = (password) => {
  return password && password.length >= 6;
};

// POST /api/auth/register
router.post('/register', requireDB, async (req, res) => {
  try {
    const {
      email,
      password,
      age,
      gender,
      height,
      weight,
      allergies,
      activityLevel,
      dietaryPreferences,
      healthGoals,
      healthConditions
    } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please provide a valid email address'
        }
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Password must be at least 6 characters long'
        }
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      passwordHash,
      age: age ? parseInt(age) : null,
      gender: gender || null,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      allergies: allergies || [],
      activityLevel: activityLevel || null,
      dietaryPreferences: dietaryPreferences || [],
      healthGoals: healthGoals || [],
      healthConditions: healthConditions || ['none']
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Return user data (without password hash)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      age: newUser.age,
      gender: newUser.gender,
      height: newUser.height,
      weight: newUser.weight,
      allergies: newUser.allergies,
      activityLevel: newUser.activityLevel,
      dietaryPreferences: newUser.dietaryPreferences,
      healthGoals: newUser.healthGoals,
      healthConditions: newUser.healthConditions,
      cuisinePreference: newUser.cuisinePreference,
      mealsPerDay: newUser.mealsPerDay,
      bmi: newUser.bmi,
      recommendedWaterIntake: newUser.recommendedWaterIntake,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt
    };

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Account created successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create account'
      }
    });
  }
});

// POST /api/auth/login
router.post('/login', requireDB, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email and password are required'
        }
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password'
        }
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password hash)
    const userResponse = {
      id: user._id,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      activityLevel: user.activityLevel,
      dietaryPreferences: user.dietaryPreferences,
      healthGoals: user.healthGoals,
      healthConditions: user.healthConditions,
      bmi: user.bmi,
      recommendedWaterIntake: user.recommendedWaterIntake,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse,
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Login failed'
      }
    });
  }
});

// GET /api/auth/me
router.get('/me', requireDB, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token required'
        }
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token'
        }
      });
    }

    // Return user data (without password hash)
    const userResponse = {
      id: user._id,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      allergies: user.allergies,
      activityLevel: user.activityLevel,
      dietaryPreferences: user.dietaryPreferences,
      healthGoals: user.healthGoals,
      healthConditions: user.healthConditions,
      bmi: user.bmi,
      recommendedWaterIntake: user.recommendedWaterIntake,
      emailNotifications: user.emailNotifications,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.json({
      success: true,
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token'
      }
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // For JWT tokens, logout is handled client-side by removing the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

// POST /api/auth/check-email - Check if email already exists
router.post('/check-email', requireDB, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required'
        }
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email already exists'
        }
      });
    }

    // Email is available
    res.json({
      success: true,
      available: true,
      message: 'Email is available'
    });

module.exports = router;

  } catch (error) {
    console.error('Email check error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to check email' }
    });
  }
});

// PUT /api/auth/email-notifications - Update email notification preferences
router.put('/email-notifications', requireDB, async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: { message: 'No token' } });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });

    const allowed = ['mealReminders', 'waterReminders', 'dietRecommendations', 'dailySummary', 'weeklySummary', 'monthlySummary'];
    const updateFields = {};
    allowed.forEach(key => {
      if (typeof req.body[key] === 'boolean') {
        updateFields[`emailNotifications.${key}`] = req.body[key];
      }
    });

    await User.updateOne({ _id: user._id }, { $set: updateFields });
    const updated = await User.findById(user._id).lean();

    res.json({ success: true, data: { emailNotifications: updated.emailNotifications } });
  } catch (error) {
    console.error('Update email notifications error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

module.exports = router;
