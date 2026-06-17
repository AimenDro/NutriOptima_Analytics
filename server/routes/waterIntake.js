const express = require('express');
const User = require('../models/User');
const { getWaterIntakeRecommendation, getHydrationStatus } = require('../services/waterIntakeCalculator');
const router = express.Router();

// GET /api/water/recommendation/:userId - Get personalized water intake recommendation
router.get('/recommendation/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID or email
    let user;
    if (userId.includes('@')) {
      user = await User.findOne({ email: userId });
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const recommendation = getWaterIntakeRecommendation(user);

    res.json({
      success: true,
      data: {
        recommendation,
        userProfile: {
          weight: user.weight,
          activityLevel: user.activityLevel,
          gender: user.gender,
          age: user.age
        }
      }
    });

  } catch (error) {
    console.error('Get water recommendation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/water/status - Get hydration status
router.post('/status', async (req, res) => {
  try {
    const { currentIntake, userId } = req.body;

    if (currentIntake === undefined) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'currentIntake is required' }
      });
    }

    // Get user's goal
    let goalIntake = 2500; // Default 2.5L in ml
    
    if (userId) {
      let user;
      if (userId.includes('@')) {
        user = await User.findOne({ email: userId });
      } else {
        user = await User.findById(userId);
      }
      
      if (user && user.recommendedWaterIntake) {
        goalIntake = user.recommendedWaterIntake;
      }
    }

    const status = getHydrationStatus(currentIntake * 1000, goalIntake); // Convert L to ml

    res.json({
      success: true,
      data: { status }
    });

  } catch (error) {
    console.error('Get hydration status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
