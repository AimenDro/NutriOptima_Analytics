const express = require('express');
const emailService = require('../services/emailService');
const reminderScheduler = require('../services/reminderScheduler');
const DailyTracking = require('../models/DailyTracking');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const router = express.Router();

// POST /api/reminders/test-email - Test email service
router.post('/test-email', async (req, res) => {
  try {
    const { email, type = 'meal' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
      });
    }

    if (!emailService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: { 
          code: 'SERVICE_UNAVAILABLE', 
          message: 'Email service not configured. Please set EMAIL_USER and EMAIL_PASSWORD in .env' 
        }
      });
    }

    let result;
    const userName = email.split('@')[0];

    switch (type) {
      case 'meal':
        result = await emailService.sendMealReminder(email, userName, 'lunch');
        break;
      case 'water':
        result = await emailService.sendWaterReminder(email, userName, 1.5, 2.5);
        break;
      case 'diet':
        result = await emailService.sendDietRecommendationReminder(email, userName, [
          'Eat more vegetables',
          'Stay hydrated',
          'Track your meals'
        ]);
        break;
      case 'summary':
        result = await emailService.sendDailySummary(email, userName, {
          calories: { consumed: 1800, goal: 2000 },
          protein: { consumed: 80, goal: 100 },
          carbs: { consumed: 200, goal: 250 },
          fats: { consumed: 50, goal: 60 },
          water: { consumed: 2.0, goal: 2.5 },
          goalAchieved: false
        });
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_TYPE', message: 'Invalid reminder type' }
        });
    }

    res.json({
      success: true,
      data: result,
      message: `Test ${type} reminder sent to ${email}`
    });

  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/reminders/send-meal - Send meal reminder manually
router.post('/send-meal', async (req, res) => {
  try {
    const { userId, mealType } = req.body;

    if (!userId || !mealType) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and mealType required' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    const result = await emailService.sendMealReminder(
      user.email,
      user.name || user.email.split('@')[0],
      mealType
    );

    res.json({
      success: true,
      data: result,
      message: `${mealType} reminder sent successfully`
    });

  } catch (error) {
    console.error('Send meal reminder error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/reminders/send-water - Send water reminder manually
router.post('/send-water', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId required' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Get today's tracking
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tracking = await DailyTracking.findOne({ userId, date: today });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_TRACKING', message: 'No tracking data found for today' }
      });
    }

    const result = await emailService.sendWaterReminder(
      user.email,
      user.name || user.email.split('@')[0],
      tracking.consumed.water,
      tracking.goals.water
    );

    res.json({
      success: true,
      data: result,
      message: 'Water reminder sent successfully'
    });

  } catch (error) {
    console.error('Send water reminder error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/reminders/send-diet - Send diet recommendation reminder manually
router.post('/send-diet', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId required' }
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' }
      });
    }

    // Get user's latest diet plan
    const dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });
    
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_DIET_PLAN', message: 'No diet plan found' }
      });
    }

    // Extract recommendations
    let recommendations = [];
    try {
      const plan = typeof dietPlan.aiGeneratedPlan === 'string' 
        ? JSON.parse(dietPlan.aiGeneratedPlan) 
        : dietPlan.aiGeneratedPlan;

      if (plan.healthTips) {
        recommendations = plan.healthTips.map(tip => tip.title || tip.description || tip);
      } else if (plan.recommendations) {
        recommendations = plan.recommendations;
      }
    } catch (e) {
      recommendations = [
        'Follow your personalized meal plan',
        'Stay hydrated throughout the day',
        'Track your meals consistently'
      ];
    }

    const result = await emailService.sendDietRecommendationReminder(
      user.email,
      user.name || user.email.split('@')[0],
      recommendations
    );

    res.json({
      success: true,
      data: result,
      message: 'Diet recommendation reminder sent successfully'
    });

  } catch (error) {
    console.error('Send diet reminder error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/reminders/status - Get reminder scheduler status
router.get('/status', (req, res) => {
  try {
    const status = reminderScheduler.getStatus();
    
    res.json({
      success: true,
      data: {
        ...status,
        emailService: {
          available: emailService.isAvailable(),
          configured: process.env.EMAIL_USER ? true : false
        }
      }
    });

  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/reminders/initialize - Initialize reminder scheduler
router.post('/initialize', (req, res) => {
  try {
    reminderScheduler.initialize();
    
    res.json({
      success: true,
      message: 'Reminder scheduler initialized successfully',
      data: reminderScheduler.getStatus()
    });

  } catch (error) {
    console.error('Initialize scheduler error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/reminders/stop - Stop all reminders
router.post('/stop', (req, res) => {
  try {
    reminderScheduler.stopAll();
    
    res.json({
      success: true,
      message: 'All reminders stopped successfully'
    });

  } catch (error) {
    console.error('Stop reminders error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
