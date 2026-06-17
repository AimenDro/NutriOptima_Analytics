const express = require('express');
const axios = require('axios');
const router = express.Router();

// Simple auth middleware (inline, no extra dependency)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
};

// POST /api/chatbot/chat
// Forwards user message to n8n NutriOptima AI Agent
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const n8nUrl = process.env.N8N_WEBHOOK_URL;
    if (!n8nUrl) {
      return res.status(500).json({ success: false, error: 'Chatbot service not configured' });
    }

    const { data } = await axios.post(n8nUrl, {
      message: message.trim(),
      userId: req.user.userId || req.user.id,
      sessionId: sessionId || req.user.userId || 'default',
    });

    // n8n AI agent returns { output: "..." }
    const aiMessage = data.output || data.message || 'Sorry, I could not process your request.';

    return res.json({
      success: true,
      message: aiMessage,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chatbot error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Chatbot service is currently unavailable. Please try again.',
    });
  }
});

module.exports = router;
