const express = require('express');
const router = express.Router();
const { generateWeeklySummary, generateMonthlySummary } = require('../services/summaryService');
const emailService = require('../services/emailService');

// GET /api/summaries/weekly/:userId - Generate weekly summary
router.get('/weekly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await generateWeeklySummary(userId);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Generate weekly summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/summaries/monthly/:userId - Generate monthly summary
router.get('/monthly/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await generateMonthlySummary(userId);

    res.json({
      success: true,
      data: { summary }
    });
  } catch (error) {
    console.error('Generate monthly summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/summaries/test-weekly - Test weekly summary email
router.post('/test-weekly', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
    }

    // Generate summary
    const summary = await generateWeeklySummary(userId);
    
    // Send email
    const result = await emailService.sendWeeklySummary(summary.user.email, summary);

    res.json({
      success: true,
      data: { summary, emailResult: result },
      message: 'Weekly summary email sent successfully'
    });
  } catch (error) {
    console.error('Test weekly summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/summaries/test-monthly - Test monthly summary email
router.post('/test-monthly', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId is required' }
      });
    }

    // Generate summary
    const summary = await generateMonthlySummary(userId);
    
    // Send email
    const result = await emailService.sendMonthlySummary(summary.user.email, summary);

    res.json({
      success: true,
      data: { summary, emailResult: result },
      message: 'Monthly summary email sent successfully'
    });
  } catch (error) {
    console.error('Test monthly summary error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
