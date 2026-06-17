const express = require('express');
const User = require('../../models/User');
const DailyTracking = require('../../models/DailyTracking');
const HealthAlert = require('../../models/HealthAlert');
const AdminActionLog = require('../../models/AdminActionLog');
const FoodRecognition = require('../../models/FoodRecognition');
const ContentModeration = require('../../models/ContentModeration');
const { authenticateAdmin, requirePermission, logAdminAction } = require('../../middleware/adminAuth');

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsersToday = await DailyTracking.distinct('userId', {
      createdAt: { $gte: today }
    }).then(users => users.length);
    
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today }
    });
    
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: lastWeek }
    });

    // Health alerts statistics
    const totalAlerts = await HealthAlert.countDocuments();
    const criticalAlerts = await HealthAlert.countDocuments({
      severity: 'critical',
      acknowledged: false
    });
    
    const alertsToday = await HealthAlert.countDocuments({
      createdAt: { $gte: today }
    });

    // Food recognition statistics
    const totalFoodRecognitions = await FoodRecognition.countDocuments();
    const recognitionsToday = await FoodRecognition.countDocuments({
      createdAt: { $gte: today }
    });

    // Content moderation statistics
    const pendingModeration = await ContentModeration.countDocuments({
      status: 'pending'
    });
    const moderationToday = await ContentModeration.countDocuments({
      createdAt: { $gte: today }
    });
    const urgentModeration = await ContentModeration.countDocuments({
      status: 'pending',
      priority: 'urgent'
    });

    // System activity
    const adminActionsToday = await AdminActionLog.countDocuments({
      timestamp: { $gte: today }
    });

    // Calculate growth rates
    const usersYesterday = await User.countDocuments({
      createdAt: { $gte: yesterday, $lt: today }
    });
    
    const userGrowthRate = usersYesterday > 0 
      ? ((newUsersToday - usersYesterday) / usersYesterday * 100).toFixed(1)
      : newUsersToday > 0 ? 100 : 0;

    // Recent activity
    const recentActions = await AdminActionLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('adminId', 'email role');

    const recentAlerts = await HealthAlert.find({ acknowledged: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    res.json({
      success: true,
      data: {
        overview: {
          users: {
            total: totalUsers,
            activeToday: activeUsersToday,
            newToday: newUsersToday,
            newThisWeek: newUsersThisWeek,
            growthRate: parseFloat(userGrowthRate)
          },
          alerts: {
            total: totalAlerts,
            critical: criticalAlerts,
            today: alertsToday
          },
          foodRecognition: {
            total: totalFoodRecognitions,
            today: recognitionsToday
          },
          moderation: {
            pending: pendingModeration,
            today: moderationToday,
            urgent: urgentModeration
          },
          system: {
            adminActionsToday: adminActionsToday,
            uptime: process.uptime()
          }
        },
        recentActivity: {
          adminActions: recentActions,
          healthAlerts: recentAlerts
        }
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DASHBOARD_ERROR', message: 'Failed to load dashboard data.' }
    });
  }
});

// Get user engagement analytics
router.get('/analytics/users', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (timeframe) {
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
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // Daily active users
    const dailyActiveUsers = await DailyTracking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          activeUsers: { $addToSet: "$userId" },
          totalEntries: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          activeUsers: { $size: "$activeUsers" },
          totalEntries: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // User registrations over time
    const userRegistrations = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          registrations: { $sum: 1 }
        }
      },
      {
        $project: {
          date: "$_id",
          registrations: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Health conditions distribution
    const healthConditions = await User.aggregate([
      { $unwind: "$healthConditions" },
      {
        $group: {
          _id: "$healthConditions",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        dailyActiveUsers,
        userRegistrations,
        healthConditions
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load user analytics.' }
    });
  }
});

// Get system health metrics
router.get('/system/health', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    // Database connection status
    const mongoose = require('mongoose');
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    // Recent error logs (you might want to implement proper logging)
    const recentErrors = await AdminActionLog.find({
      success: false,
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    })
    .sort({ timestamp: -1 })
    .limit(10);

    // API response times (mock data - implement proper monitoring)
    const apiMetrics = {
      averageResponseTime: Math.floor(Math.random() * 200) + 50, // Mock data
      requestsPerMinute: Math.floor(Math.random() * 100) + 20,
      errorRate: (Math.random() * 2).toFixed(2)
    };

    res.json({
      success: true,
      data: {
        server: {
          uptime: Math.floor(uptime),
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          },
          cpu: {
            usage: Math.floor(Math.random() * 30) + 10 // Mock data
          }
        },
        database: {
          status: dbStates[dbStatus] || 'unknown',
          connected: dbStatus === 1
        },
        api: apiMetrics,
        recentErrors: recentErrors.length
      }
    });

  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'HEALTH_ERROR', message: 'Failed to get system health.' }
    });
  }
});

// Get recent admin activity
router.get('/activity/recent', authenticateAdmin, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const recentActions = await AdminActionLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('adminId', 'email role');

    res.json({
      success: true,
      data: { actions: recentActions }
    });

  } catch (error) {
    console.error('Recent activity error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ACTIVITY_ERROR', message: 'Failed to load recent activity.' }
    });
  }
});

// Get alert statistics
router.get('/alerts/stats', authenticateAdmin, requirePermission('health.alerts'), async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    let startDate;
    const now = new Date();
    
    switch (timeframe) {
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
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // Alert statistics by severity
    const alertsBySeverity = await HealthAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 }
        }
      }
    ]);

    // Alert statistics by type
    const alertsByType = await HealthAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: "$alertType",
          count: { $sum: 1 }
        }
      }
    ]);

    // Daily alert trends
    const dailyAlerts = await HealthAlert.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          critical: {
            $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] }
          },
          warning: {
            $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          date: "$_id",
          total: "$count",
          critical: 1,
          warning: 1
        }
      },
      { $sort: { date: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        bySeverity: alertsBySeverity,
        byType: alertsByType,
        dailyTrends: dailyAlerts
      }
    });

  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ALERT_STATS_ERROR', message: 'Failed to load alert statistics.' }
    });
  }
});

module.exports = router;