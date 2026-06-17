const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',  // Vite dev server
    'http://localhost:3002',  // Alternative port
    'http://localhost:3003',  // Alternative port
    'null' // Allow file:// protocol for test.html
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'NutriOptima Analytics Server is running',
    timestamp: new Date().toISOString()
  });
});

// Auth routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading auth routes:', error.message);
  console.error(error.stack);
}

// Chatbot routes (n8n NutriOptima AI Agent)
try {
  const chatbotRoutes = require('./routes/chatbot');
  app.use('/api/chatbot', chatbotRoutes);
  console.log('✅ Chatbot routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading chatbot routes:', error.message);
  console.error(error.stack);
}

// ML routes
try {
  const mlRoutes = require('./routes/ml');
  app.use('/api/ml', mlRoutes);
  console.log('✅ ML routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading ML routes:', error.message);
  console.error(error.stack);
}

// Diet routes
try {
  const dietRoutes = require('./routes/diet');
  app.use('/api/diet', dietRoutes);
  console.log('✅ Diet routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading diet routes:', error.message);
  console.error(error.stack);
}

// Tracking routes
try {
  const trackingRoutes = require('./routes/tracking');
  app.use('/api/tracking', trackingRoutes);
  console.log('✅ Tracking routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading tracking routes:', error.message);
  console.error(error.stack);
}

// Water intake routes
try {
  const waterIntakeRoutes = require('./routes/waterIntake');
  app.use('/api/water', waterIntakeRoutes);
  console.log('✅ Water intake routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading water intake routes:', error.message);
  console.error(error.stack);
}

// Health alert routes
try {
  const healthAlertRoutes = require('./routes/healthAlerts');
  app.use('/api/health', healthAlertRoutes);
  console.log('✅ Health alert routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading health alert routes:', error.message);
  console.error(error.stack);
}

// Summary routes
try {
  const summaryRoutes = require('./routes/summaries');
  app.use('/api/summaries', summaryRoutes);
  console.log('✅ Summary routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading summary routes:', error.message);
  console.error(error.stack);
}

// Gemini AI routes
try {
  const geminiRoutes = require('./routes/gemini');
  app.use('/api/gemini', geminiRoutes);
  console.log('✅ Gemini AI routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading Gemini routes:', error.message);
  console.error(error.stack);
}

// Reminder routes
try {
  const reminderRoutes = require('./routes/reminders');
  app.use('/api/reminders', reminderRoutes);
  console.log('✅ Reminder routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading reminder routes:', error.message);
  console.error(error.stack);
}

// Contact route
try {
  const contactRoutes = require('./routes/contact');
  app.use('/api/contact', contactRoutes);
  console.log('✅ Contact routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading contact routes:', error.message);
}

// Admin routes
try {
  const adminAuthRoutes = require('./routes/admin/auth');
  app.use('/api/admin/auth', adminAuthRoutes);
  console.log('✅ Admin auth routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin auth routes:', error.message);
  console.error(error.stack);
}

try {
  const adminDashboardRoutes = require('./routes/admin/dashboard');
  app.use('/api/admin/dashboard', adminDashboardRoutes);
  console.log('✅ Admin dashboard routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin dashboard routes:', error.message);
  console.error(error.stack);
}

try {
  const adminUserRoutes = require('./routes/admin/users');
  app.use('/api/admin/users', adminUserRoutes);
  console.log('✅ Admin user management routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin user routes:', error.message);
  console.error(error.stack);
}

try {
  const adminFoodRoutes = require('./routes/admin/foodDatabase');
  app.use('/api/admin/food', adminFoodRoutes);
  console.log('✅ Admin food database routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin food routes:', error.message);
  console.error(error.stack);
}

try {
  const adminContentModerationRoutes = require('./routes/admin/contentModeration');
  app.use('/api/admin/moderation', adminContentModerationRoutes);
  console.log('✅ Admin content moderation routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin content moderation routes:', error.message);
  console.error(error.stack);
}

try {
  const adminAnalyticsRoutes = require('./routes/admin/analytics');
  app.use('/api/admin/analytics', adminAnalyticsRoutes);
  console.log('✅ Admin analytics routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin analytics routes:', error.message);
  console.error(error.stack);
}

try {
  const adminHealthAlertsRoutes = require('./routes/admin/healthAlerts');
  app.use('/api/admin/health-alerts', adminHealthAlertsRoutes);
  console.log('✅ Admin health alerts routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin health alerts routes:', error.message);
  console.error(error.stack);
}

try {
  const adminSupportRoutes = require('./routes/admin/support');
  app.use('/api/admin/support', adminSupportRoutes);
  console.log('✅ Admin support routes loaded successfully');
} catch (error) {
  console.error('❌ Error loading admin support routes:', error.message);
  console.error(error.stack);
}

// Initialize reminder scheduler
try {
  const reminderScheduler = require('./services/reminderScheduler');
  // Auto-initialize scheduler on server start
  setTimeout(() => {
    reminderScheduler.initialize();
  }, 5000); // Wait 5 seconds after server starts
} catch (error) {
  console.error('❌ Error initializing reminder scheduler:', error.message);
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Something went wrong!'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 NutriOptima Analytics Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;