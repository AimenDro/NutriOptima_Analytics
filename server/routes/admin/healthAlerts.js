const express = require('express');
const router = express.Router();
const HealthAlert = require('../../models/HealthAlert');
const User = require('../../models/User');
const { HEALTH_RULES, RDA_STANDARDS, DEFICIENCY_THRESHOLDS } = require('../../config/healthRules');
const { authenticateAdmin, requirePermission } = require('../../middleware/adminAuth');
const { checkFoodForHealthRisks, checkNutrientDeficiencies } = require('../../services/healthAlertService');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

/**
 * GET /api/admin/health-alerts/overview
 * Get health alerts overview and statistics
 */
router.get('/overview', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case '24h':
        startDate.setHours(now.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get all alerts in timeframe
    const alerts = await HealthAlert.find({
      createdAt: { $gte: startDate }
    });

    // Calculate statistics
    const stats = {
      total: alerts.length,
      active: alerts.filter(a => !a.acknowledged).length,
      acknowledged: alerts.filter(a => a.acknowledged).length,
      bySeverity: {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      },
      byType: {
        health_condition: alerts.filter(a => a.alertType === 'health_condition').length,
        nutrient_deficiency: alerts.filter(a => a.alertType === 'nutrient_deficiency').length,
        daily_limit_exceeded: alerts.filter(a => a.alertType === 'daily_limit_exceeded').length,
        trend_warning: alerts.filter(a => a.alertType === 'trend_warning').length
      },
      byCondition: {}
    };

    // Count by health condition
    alerts.forEach(alert => {
      if (alert.condition) {
        stats.byCondition[alert.condition] = (stats.byCondition[alert.condition] || 0) + 1;
      }
    });

    // Get trend data (daily counts)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const dayAlerts = alerts.filter(a => 
        a.createdAt >= date && a.createdAt < nextDate
      );
      
      trendData.push({
        date: date.toISOString().split('T')[0],
        total: dayAlerts.length,
        critical: dayAlerts.filter(a => a.severity === 'critical').length,
        warning: dayAlerts.filter(a => a.severity === 'warning').length
      });
    }

    res.json({
      success: true,
      data: {
        stats,
        trendData,
        timeframe
      }
    });
  } catch (error) {
    console.error('Error fetching health alerts overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health alerts overview'
    });
  }
});

/**
 * GET /api/admin/health-alerts/list
 * Get paginated list of health alerts with filters
 */
router.get('/list', requirePermission('view_analytics'), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      severity,
      alertType,
      condition,
      acknowledged,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    
    if (severity) query.severity = severity;
    if (alertType) query.alertType = alertType;
    if (condition) query.condition = condition;
    if (acknowledged !== undefined) query.acknowledged = acknowledged === 'true';
    if (search) {
      query.$or = [
        { userEmail: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { foodName: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [alerts, total] = await Promise.all([
      HealthAlert.find(query)
        .populate('userId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      HealthAlert.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching health alerts list:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health alerts'
    });
  }
});

/**
 * GET /api/admin/health-alerts/:id
 * Get detailed information about a specific alert
 */
router.get('/:id', requirePermission('view_analytics'), async (req, res) => {
  try {
    const alert = await HealthAlert.findById(req.params.id)
      .populate('userId', 'name email age gender healthConditions dietaryPreferences');

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: { alert }
    });
  } catch (error) {
    console.error('Error fetching alert details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert details'
    });
  }
});

/**
 * POST /api/admin/health-alerts/manual
 * Create a manual health alert for a specific user
 */
router.post('/manual', requirePermission('manage_users'), async (req, res) => {
  try {
    const { userId, severity, message, details, alertType = 'trend_warning' } = req.body;

    // Validate input
    if (!userId || !severity || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, severity, message'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create alert
    const alert = await HealthAlert.create({
      userId: user._id,
      userEmail: user.email,
      alertType,
      severity,
      message,
      details: details || `Manual alert created by admin ${req.admin.email}`
    });

    res.json({
      success: true,
      message: 'Manual alert created successfully',
      data: { alert }
    });
  } catch (error) {
    console.error('Error creating manual alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create manual alert'
    });
  }
});

/**
 * PUT /api/admin/health-alerts/:id/acknowledge
 * Acknowledge an alert (admin override)
 */
router.put('/:id/acknowledge', requirePermission('manage_users'), async (req, res) => {
  try {
    const alert = await HealthAlert.findById(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    res.json({
      success: true,
      message: 'Alert acknowledged successfully',
      data: { alert }
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alert'
    });
  }
});

/**
 * DELETE /api/admin/health-alerts/:id
 * Delete/dismiss an alert
 */
router.delete('/:id', requirePermission('manage_users'), async (req, res) => {
  try {
    const alert = await HealthAlert.findByIdAndDelete(req.params.id);
    
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }

    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert'
    });
  }
});

/**
 * POST /api/admin/health-alerts/bulk-acknowledge
 * Acknowledge multiple alerts
 */
router.post('/bulk-acknowledge', requirePermission('manage_users'), async (req, res) => {
  try {
    const { alertIds } = req.body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid alertIds array'
      });
    }

    const result = await HealthAlert.updateMany(
      { _id: { $in: alertIds } },
      { 
        acknowledged: true,
        acknowledgedAt: new Date()
      }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} alerts acknowledged`,
      data: { count: result.modifiedCount }
    });
  } catch (error) {
    console.error('Error bulk acknowledging alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to acknowledge alerts'
    });
  }
});

/**
 * GET /api/admin/health-alerts/rules
 * Get current health rules configuration
 */
router.get('/config/rules', requirePermission('view_analytics'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        healthRules: HEALTH_RULES,
        rdaStandards: RDA_STANDARDS,
        deficiencyThresholds: DEFICIENCY_THRESHOLDS
      }
    });
  } catch (error) {
    console.error('Error fetching health rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health rules'
    });
  }
});

/**
 * GET /api/admin/health-alerts/patterns
 * Analyze alert patterns and identify potential issues
 */
router.get('/analysis/patterns', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const alerts = await HealthAlert.find({
      createdAt: { $gte: startDate }
    });

    // Analyze patterns
    const patterns = {
      mostCommonAlerts: {},
      mostAffectedUsers: {},
      falsePositiveIndicators: [],
      trendingConditions: {},
      peakTimes: Array(24).fill(0)
    };

    // Count most common alert types
    alerts.forEach(alert => {
      const key = `${alert.alertType}_${alert.severity}`;
      patterns.mostCommonAlerts[key] = (patterns.mostCommonAlerts[key] || 0) + 1;

      // Count by user
      patterns.mostAffectedUsers[alert.userEmail] = (patterns.mostAffectedUsers[alert.userEmail] || 0) + 1;

      // Count by condition
      if (alert.condition) {
        patterns.trendingConditions[alert.condition] = (patterns.trendingConditions[alert.condition] || 0) + 1;
      }

      // Track peak times
      const hour = new Date(alert.createdAt).getHours();
      patterns.peakTimes[hour]++;
    });

    // Identify potential false positives (users with many alerts but all acknowledged quickly)
    const userAlertStats = {};
    alerts.forEach(alert => {
      if (!userAlertStats[alert.userEmail]) {
        userAlertStats[alert.userEmail] = { total: 0, quickAck: 0 };
      }
      userAlertStats[alert.userEmail].total++;
      
      if (alert.acknowledged && alert.acknowledgedAt) {
        const timeDiff = (alert.acknowledgedAt - alert.createdAt) / 1000 / 60; // minutes
        if (timeDiff < 5) {
          userAlertStats[alert.userEmail].quickAck++;
        }
      }
    });

    // Users with >80% quick acknowledgments might indicate false positives
    Object.entries(userAlertStats).forEach(([email, stats]) => {
      if (stats.total >= 5 && (stats.quickAck / stats.total) > 0.8) {
        patterns.falsePositiveIndicators.push({
          userEmail: email,
          totalAlerts: stats.total,
          quickAckRate: ((stats.quickAck / stats.total) * 100).toFixed(1) + '%'
        });
      }
    });

    // Sort and limit results
    patterns.mostCommonAlerts = Object.entries(patterns.mostCommonAlerts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    patterns.mostAffectedUsers = Object.entries(patterns.mostAffectedUsers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

    res.json({
      success: true,
      data: { patterns, analyzedDays: parseInt(days) }
    });
  } catch (error) {
    console.error('Error analyzing alert patterns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze alert patterns'
    });
  }
});

/**
 * POST /api/admin/health-alerts/trigger-check/:userId
 * Manually trigger health check for a user
 */
router.post('/trigger-check/:userId', requirePermission('manage_users'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { checkType = 'deficiency' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let alerts = [];
    
    if (checkType === 'deficiency') {
      alerts = await checkNutrientDeficiencies(userId, 7);
    }

    res.json({
      success: true,
      message: `Health check completed for ${user.email}`,
      data: {
        alertsGenerated: alerts.length,
        alerts
      }
    });
  } catch (error) {
    console.error('Error triggering health check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger health check'
    });
  }
});

/**
 * GET /api/admin/health-alerts/effectiveness
 * Get health alert effectiveness metrics
 */
router.get('/analysis/effectiveness', requirePermission('view_analytics'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const alerts = await HealthAlert.find({
      createdAt: { $gte: startDate }
    });

    const metrics = {
      totalAlerts: alerts.length,
      acknowledgedRate: 0,
      averageTimeToAcknowledge: 0,
      severityDistribution: {
        critical: { total: 0, acknowledged: 0 },
        warning: { total: 0, acknowledged: 0 },
        info: { total: 0, acknowledged: 0 }
      },
      userEngagement: {
        usersWithAlerts: new Set(),
        usersWhoAcknowledged: new Set()
      }
    };

    let totalAckTime = 0;
    let ackCount = 0;

    alerts.forEach(alert => {
      // Track severity
      metrics.severityDistribution[alert.severity].total++;
      if (alert.acknowledged) {
        metrics.severityDistribution[alert.severity].acknowledged++;
      }

      // Track users
      metrics.userEngagement.usersWithAlerts.add(alert.userEmail);
      if (alert.acknowledged) {
        metrics.userEngagement.usersWhoAcknowledged.add(alert.userEmail);
        
        // Calculate time to acknowledge
        if (alert.acknowledgedAt) {
          const timeDiff = (alert.acknowledgedAt - alert.createdAt) / 1000 / 60; // minutes
          totalAckTime += timeDiff;
          ackCount++;
        }
      }
    });

    metrics.acknowledgedRate = alerts.length > 0 
      ? ((alerts.filter(a => a.acknowledged).length / alerts.length) * 100).toFixed(1) + '%'
      : '0%';
    
    metrics.averageTimeToAcknowledge = ackCount > 0 
      ? (totalAckTime / ackCount).toFixed(1) + ' minutes'
      : 'N/A';

    metrics.userEngagement = {
      totalUsersWithAlerts: metrics.userEngagement.usersWithAlerts.size,
      usersWhoAcknowledged: metrics.userEngagement.usersWhoAcknowledged.size,
      engagementRate: metrics.userEngagement.usersWithAlerts.size > 0
        ? ((metrics.userEngagement.usersWhoAcknowledged.size / metrics.userEngagement.usersWithAlerts.size) * 100).toFixed(1) + '%'
        : '0%'
    };

    res.json({
      success: true,
      data: { metrics, analyzedDays: parseInt(days) }
    });
  } catch (error) {
    console.error('Error calculating effectiveness metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate effectiveness metrics'
    });
  }
});

module.exports = router;
