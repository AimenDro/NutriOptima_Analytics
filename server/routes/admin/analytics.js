const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const DailyTracking = require('../../models/DailyTracking');
const HealthAlert = require('../../models/HealthAlert');
const FoodRecognition = require('../../models/FoodRecognition');
const ContentModeration = require('../../models/ContentModeration');
const AdminActionLog = require('../../models/AdminActionLog');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');

// Helper function to get date range
const getDateRange = (timeframe) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (timeframe) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
};

// Get comprehensive analytics dashboard
router.get('/dashboard', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const startDate = getDateRange(timeframe);
    const now = new Date();

    // User analytics
    const totalUsers = await User.countDocuments();
    const newUsers = await User.countDocuments({ createdAt: { $gte: startDate } });
    const activeUsers = await DailyTracking.distinct('userId', { createdAt: { $gte: startDate } });
    
    // Engagement metrics
    const totalFoodScans = await FoodRecognition.countDocuments({ createdAt: { $gte: startDate } });
    const totalHealthAlerts = await HealthAlert.countDocuments({ createdAt: { $gte: startDate } });
    const totalModerations = await ContentModeration.countDocuments({ createdAt: { $gte: startDate } });
    
    // User growth trend
    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Daily active users trend
    const dailyActiveUsers = await DailyTracking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          users: { $addToSet: "$userId" }
        }
      },
      {
        $project: {
          date: "$_id",
          count: { $size: "$users" }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Feature usage
    const featureUsage = {
      foodScanning: totalFoodScans,
      healthAlerts: totalHealthAlerts,
      contentModeration: totalModerations
    };

    res.json({
      success: true,
      data: {
        timeframe,
        overview: {
          totalUsers,
          newUsers,
          activeUsers: activeUsers.length,
          engagementRate: totalUsers > 0 ? ((activeUsers.length / totalUsers) * 100).toFixed(2) : 0
        },
        trends: {
          userGrowth,
          dailyActiveUsers
        },
        featureUsage
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load analytics dashboard.' }
    });
  }
});

// Get user engagement analytics
router.get('/users/engagement', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getDateRange(timeframe);

    // User activity distribution
    const userActivity = await DailyTracking.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$userId",
          totalEntries: { $sum: 1 },
          lastActivity: { $max: "$createdAt" }
        }
      },
      {
        $bucket: {
          groupBy: "$totalEntries",
          boundaries: [0, 1, 5, 10, 20, 50, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
            users: { $push: "$_id" }
          }
        }
      }
    ]);

    // Retention analysis
    const cohortAnalysis = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'dailytrackings',
          localField: '_id',
          foreignField: 'userId',
          as: 'activities'
        }
      },
      {
        $project: {
          cohort: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          activeDays: { $size: "$activities" },
          lastActivity: { $max: "$activities.createdAt" }
        }
      },
      {
        $group: {
          _id: "$cohort",
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $gt: ["$activeDays", 0] }, 1, 0] }
          },
          avgActiveDays: { $avg: "$activeDays" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Health condition distribution
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
        userActivity,
        cohortAnalysis,
        healthConditions
      }
    });
  } catch (error) {
    console.error('User engagement analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load user engagement analytics.' }
    });
  }
});

// Get user retention analytics
router.get('/users/retention', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '90d' } = req.query;
    const startDate = getDateRange(timeframe);

    // Calculate retention by week
    const retentionData = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $lookup: {
          from: 'dailytrackings',
          let: { userId: '$_id', signupDate: '$createdAt' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $gte: ['$createdAt', '$$signupDate'] }
                  ]
                }
              }
            },
            {
              $project: {
                weeksSinceSignup: {
                  $floor: {
                    $divide: [
                      { $subtract: ['$createdAt', '$$signupDate'] },
                      1000 * 60 * 60 * 24 * 7
                    ]
                  }
                }
              }
            }
          ],
          as: 'activities'
        }
      },
      {
        $project: {
          signupWeek: { $dateToString: { format: "%Y-W%V", date: "$createdAt" } },
          activeWeeks: { $setUnion: "$activities.weeksSinceSignup" }
        }
      },
      {
        $group: {
          _id: "$signupWeek",
          totalUsers: { $sum: 1 },
          week0: { $sum: 1 },
          week1: { $sum: { $cond: [{ $in: [1, "$activeWeeks"] }, 1, 0] } },
          week2: { $sum: { $cond: [{ $in: [2, "$activeWeeks"] }, 1, 0] } },
          week3: { $sum: { $cond: [{ $in: [3, "$activeWeeks"] }, 1, 0] } },
          week4: { $sum: { $cond: [{ $in: [4, "$activeWeeks"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Calculate churn rate
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

    const activeLastMonth = await DailyTracking.distinct('userId', {
      createdAt: { $gte: thirtyDaysAgo }
    });

    const activePreviousMonth = await DailyTracking.distinct('userId', {
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });

    const churnedUsers = activePreviousMonth.filter(id => !activeLastMonth.includes(id));
    const churnRate = activePreviousMonth.length > 0 
      ? ((churnedUsers.length / activePreviousMonth.length) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        timeframe,
        retentionCohorts: retentionData,
        churnAnalysis: {
          churnRate: parseFloat(churnRate),
          churnedUsers: churnedUsers.length,
          previousMonthActive: activePreviousMonth.length,
          currentMonthActive: activeLastMonth.length
        }
      }
    });
  } catch (error) {
    console.error('Retention analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load retention analytics.' }
    });
  }
});

// Get system performance metrics
router.get('/system/performance', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '24h' } = req.query;
    const startDate = getDateRange(timeframe);

    // Database performance
    const dbStats = await Promise.all([
      User.estimatedDocumentCount(),
      DailyTracking.estimatedDocumentCount(),
      FoodRecognition.estimatedDocumentCount(),
      HealthAlert.estimatedDocumentCount(),
      ContentModeration.estimatedDocumentCount()
    ]);

    // API usage statistics
    const apiUsage = await AdminActionLog.aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: "$action",
          count: { $sum: 1 },
          avgDuration: { $avg: "$duration" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Error rate
    const totalActions = await AdminActionLog.countDocuments({ timestamp: { $gte: startDate } });
    const failedActions = await AdminActionLog.countDocuments({ 
      timestamp: { $gte: startDate },
      success: false 
    });
    const errorRate = totalActions > 0 ? ((failedActions / totalActions) * 100).toFixed(2) : 0;

    // System health
    const systemHealth = {
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: ((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100).toFixed(2)
      },
      cpu: {
        usage: process.cpuUsage()
      }
    };

    res.json({
      success: true,
      data: {
        timeframe,
        database: {
          collections: {
            users: dbStats[0],
            dailyTracking: dbStats[1],
            foodRecognition: dbStats[2],
            healthAlerts: dbStats[3],
            contentModeration: dbStats[4]
          },
          total: dbStats.reduce((a, b) => a + b, 0)
        },
        api: {
          usage: apiUsage,
          totalRequests: totalActions,
          failedRequests: failedActions,
          errorRate: parseFloat(errorRate)
        },
        system: systemHealth
      }
    });
  } catch (error) {
    console.error('System performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load system performance metrics.' }
    });
  }
});

// Get food recognition analytics
router.get('/food-recognition', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getDateRange(timeframe);

    // Recognition volume over time
    const recognitionVolume = await FoodRecognition.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Model performance
    const modelPerformance = await FoodRecognition.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$modelType",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$topPrediction.confidence" }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Top recognized foods
    const topFoods = await FoodRecognition.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$topPrediction.fruit",
          count: { $sum: 1 },
          avgConfidence: { $avg: "$topPrediction.confidence" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Confidence distribution
    const confidenceDistribution = await FoodRecognition.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $bucket: {
          groupBy: "$topPrediction.confidence",
          boundaries: [0, 0.3, 0.5, 0.7, 0.8, 0.9, 1.0],
          default: "other",
          output: {
            count: { $sum: 1 }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        timeframe,
        volume: recognitionVolume,
        modelPerformance,
        topFoods,
        confidenceDistribution
      }
    });
  } catch (error) {
    console.error('Food recognition analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load food recognition analytics.' }
    });
  }
});

// Get health alerts analytics
router.get('/health-alerts', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const startDate = getDateRange(timeframe);

    // Alert volume over time
    const alertVolume = await HealthAlert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: 1 },
          critical: { $sum: { $cond: [{ $eq: ["$severity", "critical"] }, 1, 0] } },
          warning: { $sum: { $cond: [{ $eq: ["$severity", "warning"] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Alerts by type
    const alertsByType = await HealthAlert.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: "$alertType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Alerts by condition
    const alertsByCondition = await HealthAlert.aggregate([
      { $match: { createdAt: { $gte: startDate }, condition: { $exists: true } } },
      {
        $group: {
          _id: "$condition",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Acknowledgment rate
    const totalAlerts = await HealthAlert.countDocuments({ createdAt: { $gte: startDate } });
    const acknowledgedAlerts = await HealthAlert.countDocuments({ 
      createdAt: { $gte: startDate },
      acknowledged: true 
    });
    const acknowledgmentRate = totalAlerts > 0 
      ? ((acknowledgedAlerts / totalAlerts) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        timeframe,
        volume: alertVolume,
        byType: alertsByType,
        byCondition: alertsByCondition,
        acknowledgmentRate: parseFloat(acknowledgmentRate),
        totalAlerts,
        acknowledgedAlerts
      }
    });
  } catch (error) {
    console.error('Health alerts analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'ANALYTICS_ERROR', message: 'Failed to load health alerts analytics.' }
    });
  }
});

// Export data for custom reports
router.post('/export', authenticateAdmin, requirePermission('system.analytics'), async (req, res) => {
  try {
    const { dataType, timeframe = '30d', format = 'json' } = req.body;
    const startDate = getDateRange(timeframe);

    let data;
    switch (dataType) {
      case 'users':
        data = await User.find({ createdAt: { $gte: startDate } })
          .select('-password -passwordHash')
          .lean();
        break;
      case 'food_recognition':
        data = await FoodRecognition.find({ createdAt: { $gte: startDate } }).lean();
        break;
      case 'health_alerts':
        data = await HealthAlert.find({ createdAt: { $gte: startDate } }).lean();
        break;
      case 'admin_actions':
        data = await AdminActionLog.find({ timestamp: { $gte: startDate } })
          .populate('adminId', 'email role')
          .lean();
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_DATA_TYPE', message: 'Invalid data type specified.' }
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${dataType}_${timeframe}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: {
          dataType,
          timeframe,
          count: data.length,
          records: data
        }
      });
    }
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'EXPORT_ERROR', message: 'Failed to export data.' }
    });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      return typeof value === 'object' ? JSON.stringify(value) : value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

module.exports = router;