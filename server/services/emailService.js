const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initialize();
  }

  initialize() {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.warn('⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASSWORD in .env');
      return;
    }

    try {
      // Create transporter with Gmail or custom SMTP
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      this.initialized = true;
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
    }
  }

  isAvailable() {
    return this.initialized && this.transporter !== null;
  }

  /**
   * Send meal reminder email
   */
  async sendMealReminder(userEmail, userName, mealType) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const mealEmojis = {
      breakfast: '🍳',
      lunch: '🍽️',
      dinner: '🍲',
      snack: '🍎'
    };

    const emoji = mealEmojis[mealType.toLowerCase()] || '🍴';

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `${emoji} Time to Log Your ${mealType}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${emoji} Meal Reminder</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'}!</h2>
              <p>Don't forget to log your <strong>${mealType}</strong>!</p>
              <p>Tracking your meals helps you:</p>
              <ul>
                <li>✅ Stay on track with your nutrition goals</li>
                <li>📊 Monitor your calorie and macro intake</li>
                <li>🎯 Achieve your health objectives faster</li>
              </ul>
              <p>You can log your meal by:</p>
              <ul>
                <li>📸 Taking a photo of your food (AI will analyze it)</li>
                <li>✏️ Manually entering the food name</li>
              </ul>
              <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}/dashboard" class="button">
                Log Your Meal Now
              </a>
              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                💡 Tip: Consistent tracking leads to better results!
              </p>
            </div>
            <div class="footer">
              <p>NutriOptima - Your Personal Nutrition Assistant</p>
              <p>You're receiving this because you have reminders enabled.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Meal reminder sent to ${userEmail}`);
      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send meal reminder:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send water intake reminder email
   */
  async sendWaterReminder(userEmail, userName, currentIntake, goalIntake) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const remaining = Math.max(0, goalIntake - currentIntake);
    const percentage = Math.round((currentIntake / goalIntake) * 100);

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `💧 Hydration Reminder - Stay Hydrated!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f0f9ff; padding: 30px; border-radius: 0 0 10px 10px; }
            .progress-bar { background: #e0f2fe; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; }
            .progress-fill { background: linear-gradient(90deg, #06b6d4 0%, #0891b2 100%); height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat { text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #0891b2; }
            .stat-label { color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💧 Hydration Check</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'}!</h2>
              <p>Time to check your water intake!</p>
              
              <div class="stats">
                <div class="stat">
                  <div class="stat-value">${currentIntake.toFixed(1)}L</div>
                  <div class="stat-label">Consumed</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${goalIntake}L</div>
                  <div class="stat-label">Goal</div>
                </div>
                <div class="stat">
                  <div class="stat-value">${remaining.toFixed(1)}L</div>
                  <div class="stat-label">Remaining</div>
                </div>
              </div>

              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%">
                  ${percentage}%
                </div>
              </div>

              <p><strong>Why hydration matters:</strong></p>
              <ul>
                <li>💪 Boosts energy and reduces fatigue</li>
                <li>🧠 Improves brain function and concentration</li>
                <li>🔥 Supports metabolism and weight management</li>
                <li>✨ Promotes healthy skin and digestion</li>
              </ul>

              <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}/dashboard" class="button">
                Log Water Intake
              </a>

              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                💡 Tip: Keep a water bottle nearby and sip throughout the day!
              </p>
            </div>
            <div class="footer">
              <p>NutriOptima - Your Personal Nutrition Assistant</p>
              <p>Stay hydrated, stay healthy! 💧</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Water reminder sent to ${userEmail}`);
      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send water reminder:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send diet recommendation follow-up email
   */
  async sendDietRecommendationReminder(userEmail, userName, recommendations) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const recommendationsList = recommendations
      .slice(0, 3)
      .map(rec => `<li>✅ ${rec}</li>`)
      .join('');

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎯 Follow Your Diet Recommendations`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #faf5ff; padding: 30px; border-radius: 0 0 10px 10px; }
            .recommendations { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
            .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Your Diet Plan</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'}!</h2>
              <p>Remember to follow your personalized diet recommendations!</p>
              
              <div class="recommendations">
                <h3>Today's Focus:</h3>
                <ul>
                  ${recommendationsList}
                </ul>
              </div>

              <p><strong>Benefits of following your plan:</strong></p>
              <ul>
                <li>🎯 Achieve your health goals faster</li>
                <li>⚡ Maintain consistent energy levels</li>
                <li>💪 Support your fitness objectives</li>
                <li>🌟 Improve overall well-being</li>
              </ul>

              <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}/diet-planning" class="button">
                View Full Diet Plan
              </a>

              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                💡 Tip: Small consistent steps lead to big results!
              </p>
            </div>
            <div class="footer">
              <p>NutriOptima - Your Personal Nutrition Assistant</p>
              <p>You've got this! 💪</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Diet recommendation reminder sent to ${userEmail}`);
      return { success: true, message: 'Reminder sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send diet reminder:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send daily summary email
   */
  async sendDailySummary(userEmail, userName, summaryData) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const { calories, protein, carbs, fats, water, goalAchieved } = summaryData;

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📊 Your Daily Nutrition Summary`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #fffbeb; padding: 30px; border-radius: 0 0 10px 10px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #d97706; }
            .stat-label { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .achievement { background: #dcfce7; border: 2px solid #10b981; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Daily Summary</h1>
            </div>
            <div class="content">
              <h2>Hi ${userName || 'there'}!</h2>
              <p>Here's your nutrition summary for today:</p>
              
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-value">${calories.consumed}</div>
                  <div class="stat-label">Calories (${calories.goal} goal)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${water.consumed}L</div>
                  <div class="stat-label">Water (${water.goal}L goal)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${protein.consumed}g</div>
                  <div class="stat-label">Protein (${protein.goal}g goal)</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${carbs.consumed}g</div>
                  <div class="stat-label">Carbs (${carbs.goal}g goal)</div>
                </div>
              </div>

              ${goalAchieved ? `
                <div class="achievement">
                  <h3>🎉 Congratulations!</h3>
                  <p>You achieved your daily nutrition goals!</p>
                </div>
              ` : `
                <p style="color: #d97706; font-weight: bold;">Keep going! You're making progress towards your goals.</p>
              `}

              <a href="${process.env.CLIENT_URL || 'http://localhost:3001'}/dashboard" class="button">
                View Full Dashboard
              </a>

              <p style="margin-top: 20px; color: #6b7280; font-size: 14px;">
                💡 Tomorrow is a new day to crush your goals!
              </p>
            </div>
            <div class="footer">
              <p>NutriOptima - Your Personal Nutrition Assistant</p>
              <p>Keep up the great work! 🌟</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Daily summary sent to ${userEmail}`);
      return { success: true, message: 'Summary sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send daily summary:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send weekly summary email
   */
  async sendWeeklySummary(userEmail, summary) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const userName = summary.user.name;
    const dateRange = `${new Date(summary.startDate).toLocaleDateString()} - ${new Date(summary.endDate).toLocaleDateString()}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
          .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .metric:last-child { border-bottom: none; }
          .metric-label { color: #6b7280; }
          .metric-value { font-weight: bold; color: #111827; }
          .feedback-item { padding: 12px; margin: 8px 0; background: #f3f4f6; border-left: 4px solid #667eea; border-radius: 4px; }
          .achievement { display: flex; align-items: center; padding: 12px; margin: 8px 0; background: #fef3c7; border-radius: 8px; }
          .achievement-icon { font-size: 24px; margin-right: 12px; }
          .recommendation { padding: 12px; margin: 8px 0; background: #dbeafe; border-radius: 8px; }
          .recommendation-title { font-weight: bold; color: #1e40af; margin-bottom: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📊 Your Weekly Nutrition Summary</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${dateRange}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">📈 Weekly Performance</div>
              <div class="metric">
                <span class="metric-label">Days Logged</span>
                <span class="metric-value">${summary.performance.daysLogged}/${summary.performance.totalDays} (${summary.performance.consistency}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Calorie Goals Met</span>
                <span class="metric-value">${summary.analytics.goalAchievement.calories}/${summary.performance.totalDays} (${summary.performance.calorieCompliance}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Hydration Goals Met</span>
                <span class="metric-value">${summary.analytics.goalAchievement.water}/${summary.performance.totalDays} (${summary.performance.waterCompliance}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Longest Streak</span>
                <span class="metric-value">${summary.performance.longestStreak} days</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📊 Average Daily Intake</div>
              <div class="metric">
                <span class="metric-label">Calories</span>
                <span class="metric-value">${summary.analytics.averages.calories} cal</span>
              </div>
              <div class="metric">
                <span class="metric-label">Protein</span>
                <span class="metric-value">${summary.analytics.averages.protein}g</span>
              </div>
              <div class="metric">
                <span class="metric-label">Carbs</span>
                <span class="metric-value">${summary.analytics.averages.carbs}g</span>
              </div>
              <div class="metric">
                <span class="metric-label">Fats</span>
                <span class="metric-value">${summary.analytics.averages.fats}g</span>
              </div>
              <div class="metric">
                <span class="metric-label">Water</span>
                <span class="metric-value">${summary.analytics.averages.water}L</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">💬 Feedback</div>
              ${summary.feedback.map(item => `<div class="feedback-item">${item}</div>`).join('')}
            </div>

            ${summary.achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">🏆 Achievements</div>
              ${summary.achievements.map(achievement => `
                <div class="achievement">
                  <span class="achievement-icon">${achievement.icon}</span>
                  <div>
                    <strong>${achievement.title}</strong>
                    <div style="color: #6b7280; font-size: 14px;">${achievement.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${summary.recommendations.length > 0 ? `
            <div class="section">
              <div class="section-title">💡 Recommendations for Next Week</div>
              ${summary.recommendations.map((rec, index) => `
                <div class="recommendation">
                  <div class="recommendation-title">${index + 1}. ${rec.icon} ${rec.title}</div>
                  <div style="color: #1e40af; font-size: 14px;">${rec.description}</div>
                  ${rec.action ? `<div style="color: #6b7280; font-size: 13px; margin-top: 4px;">→ ${rec.action}</div>` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="http://localhost:3001/dashboard" class="button">View Detailed Analytics</a>
            </div>
          </div>

          <div class="footer">
            <p>Keep up the great work! 💪</p>
            <p style="font-size: 12px; color: #9ca3af;">NutriOptima Analytics</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📊 Your Weekly Nutrition Summary - ${dateRange}`,
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Weekly summary sent to ${userEmail}`);
      return { success: true, message: 'Weekly summary sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send weekly summary:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Send monthly summary email
   */
  async sendMonthlySummary(userEmail, summary) {
    if (!this.isAvailable()) {
      console.warn('Email service not available');
      return { success: false, message: 'Email service not configured' };
    }

    const userName = summary.user.name;
    const monthName = new Date(summary.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; }
          .section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .section-title { font-size: 18px; font-weight: bold; color: #f5576c; margin-bottom: 15px; border-bottom: 2px solid #f5576c; padding-bottom: 10px; }
          .metric { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .metric:last-child { border-bottom: none; }
          .metric-label { color: #6b7280; }
          .metric-value { font-weight: bold; color: #111827; }
          .trend { display: flex; align-items: center; padding: 12px; margin: 8px 0; background: #f3f4f6; border-radius: 8px; }
          .trend-icon { font-size: 24px; margin-right: 12px; }
          .feedback-item { padding: 12px; margin: 8px 0; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; }
          .achievement { display: flex; align-items: center; padding: 12px; margin: 8px 0; background: #d1fae5; border-radius: 8px; }
          .achievement-icon { font-size: 24px; margin-right: 12px; }
          .recommendation { padding: 12px; margin: 8px 0; background: #dbeafe; border-radius: 8px; }
          .recommendation-title { font-weight: bold; color: #1e40af; margin-bottom: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📅 Your Monthly Nutrition Report</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${monthName}</p>
          </div>
          
          <div class="content">
            <div class="section">
              <div class="section-title">📈 Monthly Overview</div>
              <div class="metric">
                <span class="metric-label">Total Days Logged</span>
                <span class="metric-value">${summary.performance.daysLogged}/${summary.performance.totalDays} (${summary.performance.consistency}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Calorie Goals Met</span>
                <span class="metric-value">${summary.analytics.goalAchievement.calories}/${summary.performance.totalDays} (${summary.performance.calorieCompliance}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Hydration Goals Met</span>
                <span class="metric-value">${summary.analytics.goalAchievement.water}/${summary.performance.totalDays} (${summary.performance.waterCompliance}%)</span>
              </div>
              <div class="metric">
                <span class="metric-label">Longest Streak</span>
                <span class="metric-value">${summary.performance.longestStreak} days</span>
              </div>
            </div>

            <div class="section">
              <div class="section-title">📊 Monthly Averages</div>
              <div class="metric">
                <span class="metric-label">Calories</span>
                <span class="metric-value">${summary.analytics.averages.calories} cal/day</span>
              </div>
              <div class="metric">
                <span class="metric-label">Protein</span>
                <span class="metric-value">${summary.analytics.averages.protein}g/day</span>
              </div>
              <div class="metric">
                <span class="metric-label">Carbs</span>
                <span class="metric-value">${summary.analytics.averages.carbs}g/day</span>
              </div>
              <div class="metric">
                <span class="metric-label">Fats</span>
                <span class="metric-value">${summary.analytics.averages.fats}g/day</span>
              </div>
              <div class="metric">
                <span class="metric-label">Water</span>
                <span class="metric-value">${summary.analytics.averages.water}L/day</span>
              </div>
            </div>

            ${summary.trends ? `
            <div class="section">
              <div class="section-title">📈 Trends vs Last Month</div>
              ${summary.trends.calories.direction !== 'same' ? `
              <div class="trend">
                <span class="trend-icon">${summary.trends.calories.direction === 'up' ? '📈' : '📉'}</span>
                <div>
                  <strong>Calories ${summary.trends.calories.direction === 'up' ? 'Increased' : 'Decreased'}</strong>
                  <div style="color: #6b7280; font-size: 14px;">${summary.trends.calories.change}% from last month</div>
                </div>
              </div>
              ` : ''}
              ${summary.trends.protein.direction !== 'same' ? `
              <div class="trend">
                <span class="trend-icon">${summary.trends.protein.direction === 'up' ? '📈' : '📉'}</span>
                <div>
                  <strong>Protein ${summary.trends.protein.direction === 'up' ? 'Increased' : 'Decreased'}</strong>
                  <div style="color: #6b7280; font-size: 14px;">${summary.trends.protein.change}% from last month</div>
                </div>
              </div>
              ` : ''}
              ${summary.trends.water.direction !== 'same' ? `
              <div class="trend">
                <span class="trend-icon">${summary.trends.water.direction === 'up' ? '📈' : '📉'}</span>
                <div>
                  <strong>Hydration ${summary.trends.water.direction === 'up' ? 'Improved' : 'Decreased'}</strong>
                  <div style="color: #6b7280; font-size: 14px;">${summary.trends.water.change}% from last month</div>
                </div>
              </div>
              ` : ''}
            </div>
            ` : ''}

            <div class="section">
              <div class="section-title">💬 Monthly Feedback</div>
              ${summary.feedback.map(item => `<div class="feedback-item">${item}</div>`).join('')}
            </div>

            ${summary.achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">🏆 Monthly Achievements</div>
              ${summary.achievements.map(achievement => `
                <div class="achievement">
                  <span class="achievement-icon">${achievement.icon}</span>
                  <div>
                    <strong>${achievement.title}</strong>
                    <div style="color: #6b7280; font-size: 14px;">${achievement.description}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}

            ${summary.recommendations.length > 0 ? `
            <div class="section">
              <div class="section-title">🎯 Goals for Next Month</div>
              ${summary.recommendations.map((rec, index) => `
                <div class="recommendation">
                  <div class="recommendation-title">${index + 1}. ${rec.icon} ${rec.title}</div>
                  <div style="color: #1e40af; font-size: 14px;">${rec.description}</div>
                  ${rec.action ? `<div style="color: #6b7280; font-size: 13px; margin-top: 4px;">→ ${rec.action}</div>` : ''}
                </div>
              `).join('')}
            </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="http://localhost:3001/dashboard" class="button">View Detailed Analytics</a>
            </div>
          </div>

          <div class="footer">
            <p>Keep pushing forward! You're making great progress! 💪</p>
            <p style="font-size: 12px; color: #9ca3af;">NutriOptima Analytics</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"NutriOptima" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `📅 Your Monthly Nutrition Report - ${monthName}`,
      html: htmlContent
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Monthly summary sent to ${userEmail}`);
      return { success: true, message: 'Monthly summary sent successfully' };
    } catch (error) {
      console.error('❌ Failed to send monthly summary:', error.message);
      return { success: false, message: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
