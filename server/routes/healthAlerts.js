const express = require('express');
const router = express.Router();
const {
  checkFoodForHealthRisks,
  checkDailyLimits,
  checkNutrientDeficiencies,
  getActiveAlerts,
  getAlertsBySeverity,
  acknowledgeAlert,
  dismissAlert,
  getAlertStats
} = require('../services/healthAlertService');

// GET /api/health/alerts/:userId - Get all active alerts
router.get('/alerts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const alerts = await getActiveAlerts(userId);

    res.json({
      success: true,
      data: { alerts },
      count: alerts.length
    });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/health/alerts/active/:userId - Get unacknowledged alerts
router.get('/alerts/active/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const alerts = await getActiveAlerts(userId);

    res.json({
      success: true,
      data: { alerts },
      count: alerts.length
    });
  } catch (error) {
    console.error('Get active alerts error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/health/alerts/severity/:userId/:severity - Get alerts by severity
router.get('/alerts/severity/:userId/:severity', async (req, res) => {
  try {
    const { userId, severity } = req.params;
    
    if (!['critical', 'warning', 'info'].includes(severity)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_SEVERITY', message: 'Severity must be critical, warning, or info' }
      });
    }

    const alerts = await getAlertsBySeverity(userId, severity);

    res.json({
      success: true,
      data: { alerts, severity },
      count: alerts.length
    });
  } catch (error) {
    console.error('Get alerts by severity error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/health/alerts/stats/:userId - Get alert statistics
router.get('/alerts/stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await getAlertStats(userId);

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Get alert stats error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/health/check-food - Check food against health rules
router.post('/check-food', async (req, res) => {
  try {
    const { userId, foodEntry } = req.body;

    if (!userId || !foodEntry) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and foodEntry are required' }
      });
    }

    const alerts = await checkFoodForHealthRisks(userId, foodEntry);

    res.json({
      success: true,
      data: { 
        alerts,
        hasWarnings: alerts.length > 0,
        criticalCount: alerts.filter(a => a.severity === 'critical').length
      }
    });
  } catch (error) {
    console.error('Check food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/health/check-daily-limits - Check daily limits
router.post('/check-daily-limits', async (req, res) => {
  try {
    const { userId, date } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
    }

    const checkDate = date ? new Date(date) : new Date();
    const alerts = await checkDailyLimits(userId, checkDate);

    res.json({
      success: true,
      data: { 
        alerts,
        date: checkDate,
        hasViolations: alerts.length > 0
      }
    });
  } catch (error) {
    console.error('Check daily limits error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/health/check-deficiencies - Check nutrient deficiencies
router.post('/check-deficiencies', async (req, res) => {
  try {
    const { userId, days } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
    }

    const period = days || 7;
    const alerts = await checkNutrientDeficiencies(userId, period);

    res.json({
      success: true,
      data: { 
        alerts,
        period: `${period} days`,
        deficienciesFound: alerts.length
      }
    });
  } catch (error) {
    console.error('Check deficiencies error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/health/alerts/:alertId/acknowledge - Acknowledge an alert
router.post('/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await acknowledgeAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      data: { alert },
      message: 'Alert acknowledged successfully'
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// DELETE /api/health/alerts/:alertId - Dismiss/delete an alert
router.delete('/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const alert = await dismissAlert(alertId);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: { code: 'ALERT_NOT_FOUND', message: 'Alert not found' }
      });
    }

    res.json({
      success: true,
      message: 'Alert dismissed successfully'
    });
  } catch (error) {
    console.error('Dismiss alert error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
