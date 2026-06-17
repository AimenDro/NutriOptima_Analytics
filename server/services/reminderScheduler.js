const cron = require('node-cron');
const DailyTracking = require('../models/DailyTracking');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const emailService = require('./emailService');

class ReminderScheduler {
  constructor() {
    this.jobs = [];
    this.initialized = false;
  }

  /**
   * Initialize all scheduled reminders
   */
  initialize() {
    if (this.initialized) {
      console.log('⚠️ Reminder scheduler already initialized');
      return;
    }

    console.log('🔔 Initializing reminder scheduler...');

    // Breakfast reminder - 8:00 AM daily
    this.scheduleBreakfastReminder();

    // Lunch reminder - 12:30 PM daily
    this.scheduleLunchReminder();

    // Dinner reminder - 7:00 PM daily
    this.scheduleDinnerReminder();

    // Water reminders - Every 2 hours from 9 AM to 7 PM
    this.scheduleWaterReminders();

    // Diet recommendation reminder - 9:00 AM daily
    this.scheduleDietRecommendationReminder();

    // Daily summary - 9:00 PM daily
    this.scheduleDailySummary();

    // Weekly summary - Every Sunday at 9:00 AM
    this.scheduleWeeklySummary();

    // Monthly summary - 1st of every month at 9:00 AM
    this.scheduleMonthlySummary();

    this.initialized = true;
    console.log('✅ Reminder scheduler initialized successfully');
    console.log(`📅 Active reminder jobs: ${this.jobs.length}`);
  }

  /**
   * Schedule breakfast reminder - 8:00 AM
   */
  scheduleBreakfastReminder() {
    const job = cron.schedule('0 8 * * *', async () => {
      console.log('🍳 Running breakfast reminder job...');
      await this.sendMealReminders('breakfast');
    });

    this.jobs.push({ name: 'Breakfast Reminder', schedule: '8:00 AM', job });
    console.log('✅ Breakfast reminder scheduled for 8:00 AM daily');
  }

  /**
   * Schedule lunch reminder - 12:30 PM
   */
  scheduleLunchReminder() {
    const job = cron.schedule('30 12 * * *', async () => {
      console.log('🍽️ Running lunch reminder job...');
      await this.sendMealReminders('lunch');
    });

    this.jobs.push({ name: 'Lunch Reminder', schedule: '12:30 PM', job });
    console.log('✅ Lunch reminder scheduled for 12:30 PM daily');
  }

  /**
   * Schedule dinner reminder - 7:00 PM
   */
  scheduleDinnerReminder() {
    const job = cron.schedule('0 19 * * *', async () => {
      console.log('🍲 Running dinner reminder job...');
      await this.sendMealReminders('dinner');
    });

    this.jobs.push({ name: 'Dinner Reminder', schedule: '7:00 PM', job });
    console.log('✅ Dinner reminder scheduled for 7:00 PM daily');
  }

  /**
   * Schedule water reminders - Every 2 hours from 9 AM to 7 PM
   */
  scheduleWaterReminders() {
    // 9 AM, 11 AM, 1 PM, 3 PM, 5 PM, 7 PM
    const times = ['0 9 * * *', '0 11 * * *', '0 13 * * *', '0 15 * * *', '0 17 * * *', '0 19 * * *'];
    
    times.forEach((schedule, index) => {
      const job = cron.schedule(schedule, async () => {
        console.log('💧 Running water reminder job...');
        await this.sendWaterReminders();
      });

      this.jobs.push({ name: `Water Reminder ${index + 1}`, schedule, job });
    });

    console.log('✅ Water reminders scheduled (6 times daily)');
  }

  /**
   * Schedule diet recommendation reminder - 9:00 AM
   */
  scheduleDietRecommendationReminder() {
    const job = cron.schedule('0 9 * * *', async () => {
      console.log('🎯 Running diet recommendation reminder job...');
      await this.sendDietRecommendations();
    });

    this.jobs.push({ name: 'Diet Recommendation', schedule: '9:00 AM', job });
    console.log('✅ Diet recommendation reminder scheduled for 9:00 AM daily');
  }

  /**
   * Schedule daily summary - 9:00 PM
   */
  scheduleDailySummary() {
    const job = cron.schedule('0 21 * * *', async () => {
      console.log('📊 Running daily summary job...');
      await this.sendDailySummaries();
    });

    this.jobs.push({ name: 'Daily Summary', schedule: '9:00 PM', job });
    console.log('✅ Daily summary scheduled for 9:00 PM daily');
  }

  /**
   * Send meal reminders to all users
   */
  async sendMealReminders(mealType) {
    try {
      // Get all users with active tracking
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const trackingRecords = await DailyTracking.find({ date: today });
      
      for (const tracking of trackingRecords) {
        // Check if user has already logged this meal
        const hasMealLogged = tracking.foodEntries.some(entry => {
          const entryTime = new Date(entry.timestamp);
          const hour = entryTime.getHours();
          
          // Breakfast: 6-10 AM, Lunch: 11 AM-3 PM, Dinner: 5-10 PM
          if (mealType === 'breakfast' && hour >= 6 && hour <= 10) return true;
          if (mealType === 'lunch' && hour >= 11 && hour <= 15) return true;
          if (mealType === 'dinner' && hour >= 17 && hour <= 22) return true;
          return false;
        });

        // Only send reminder if meal not logged yet
        if (!hasMealLogged) {
          const user = await User.findOne({ email: tracking.userEmail });
          if (user && user.email && user.emailNotifications?.mealReminders !== false) {
            await emailService.sendMealReminder(
              user.email,
              user.name || user.email.split('@')[0],
              mealType
            );
          }
        }
      }

      console.log(`✅ ${mealType} reminders sent`);
    } catch (error) {
      console.error(`❌ Error sending ${mealType} reminders:`, error.message);
    }
  }

  /**
   * Send water intake reminders
   */
  async sendWaterReminders() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const trackingRecords = await DailyTracking.find({ date: today });
      
      for (const tracking of trackingRecords) {
        // Only send if user hasn't reached 80% of water goal
        const waterPercentage = (tracking.consumed.water / tracking.goals.water) * 100;
        
        if (waterPercentage < 80) {
          const user = await User.findOne({ email: tracking.userEmail });
          if (user && user.email && user.emailNotifications?.waterReminders !== false) {
            await emailService.sendWaterReminder(
              user.email,
              user.name || user.email.split('@')[0],
              tracking.consumed.water,
              tracking.goals.water
            );
          }
        }
      }

      console.log('✅ Water reminders sent');
    } catch (error) {
      console.error('❌ Error sending water reminders:', error.message);
    }
  }

  /**
   * Send diet recommendation reminders
   */
  async sendDietRecommendations() {
    try {
      // Get all users with diet plans
      const users = await User.find({});
      
      for (const user of users) {
        if (!user.email) continue;
        if (user.emailNotifications?.dietRecommendations === false) continue;

        // Get user's latest diet plan
        const dietPlan = await DietPlan.findOne({ userEmail: user.email })
          .sort({ createdAt: -1 });

        if (dietPlan && dietPlan.aiGeneratedPlan) {
          // Extract recommendations from diet plan
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
            // If parsing fails, use generic recommendations
            recommendations = [
              'Follow your personalized meal plan',
              'Stay hydrated throughout the day',
              'Track your meals consistently'
            ];
          }

          if (recommendations.length > 0) {
            await emailService.sendDietRecommendationReminder(
              user.email,
              user.name || user.email.split('@')[0],
              recommendations
            );
          }
        }
      }

      console.log('✅ Diet recommendation reminders sent');
    } catch (error) {
      console.error('❌ Error sending diet recommendations:', error.message);
    }
  }

  /**
   * Send daily summaries
   */
  async sendDailySummaries() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const trackingRecords = await DailyTracking.find({ date: today });
      
      for (const tracking of trackingRecords) {
        const user = await User.findOne({ email: tracking.userEmail });
        if (!user || !user.email) continue;
        if (user.emailNotifications?.dailySummary === false) continue;

        const progress = tracking.getProgress();
        
        const summaryData = {
          calories: {
            consumed: tracking.consumed.calories,
            goal: tracking.goals.calories
          },
          protein: {
            consumed: tracking.consumed.protein,
            goal: tracking.goals.protein
          },
          carbs: {
            consumed: tracking.consumed.carbs,
            goal: tracking.goals.carbs
          },
          fats: {
            consumed: tracking.consumed.fats,
            goal: tracking.goals.fats
          },
          water: {
            consumed: tracking.consumed.water,
            goal: tracking.goals.water
          },
          goalAchieved: tracking.goalAchieved.calories && tracking.goalAchieved.water
        };

        await emailService.sendDailySummary(
          user.email,
          user.name || user.email.split('@')[0],
          summaryData
        );
      }

      console.log('✅ Daily summaries sent');
    } catch (error) {
      console.error('❌ Error sending daily summaries:', error.message);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll() {
    this.jobs.forEach(({ name, job }) => {
      job.stop();
      console.log(`⏹️ Stopped: ${name}`);
    });
    this.jobs = [];
    this.initialized = false;
    console.log('✅ All reminder jobs stopped');
  }

  /**
   * Schedule weekly summary - Every Sunday at 9:00 AM
   */
  scheduleWeeklySummary() {
    const { generateWeeklySummary } = require('./summaryService');

    const job = cron.schedule('0 9 * * 0', async () => {
      console.log('📊 Running weekly summary job...');
      
      try {
        const users = await User.find({});
        console.log(`📧 Sending weekly summaries to ${users.length} users...`);

        for (const user of users) {
          try {
            if (user.emailNotifications?.weeklySummary === false) continue;
            const summary = await generateWeeklySummary(user._id);
            await emailService.sendWeeklySummary(user.email, summary);
            console.log(`✅ Weekly summary sent to ${user.email}`);
          } catch (error) {
            console.error(`❌ Failed to send weekly summary to ${user.email}:`, error.message);
          }
        }

        console.log('✅ Weekly summary job completed');
      } catch (error) {
        console.error('❌ Weekly summary job failed:', error);
      }
    });

    this.jobs.push({
      name: 'Weekly Summary',
      schedule: 'Every Sunday at 9:00 AM',
      job
    });

    console.log('✅ Weekly summary scheduled for every Sunday at 9:00 AM');
  }

  /**
   * Schedule monthly summary - 1st of every month at 9:00 AM
   */
  scheduleMonthlySummary() {
    const { generateMonthlySummary } = require('./summaryService');

    const job = cron.schedule('0 9 1 * *', async () => {
      console.log('📅 Running monthly summary job...');
      
      try {
        const users = await User.find({});
        console.log(`📧 Sending monthly summaries to ${users.length} users...`);

        for (const user of users) {
          try {
            if (user.emailNotifications?.monthlySummary === false) continue;
            const summary = await generateMonthlySummary(user._id);
            await emailService.sendMonthlySummary(user.email, summary);
            console.log(`✅ Monthly summary sent to ${user.email}`);
          } catch (error) {
            console.error(`❌ Failed to send monthly summary to ${user.email}:`, error.message);
          }
        }

        console.log('✅ Monthly summary job completed');
      } catch (error) {
        console.error('❌ Monthly summary job failed:', error);
      }
    });

    this.jobs.push({
      name: 'Monthly Summary',
      schedule: '1st of every month at 9:00 AM',
      job
    });

    console.log('✅ Monthly summary scheduled for 1st of every month at 9:00 AM');
  }

  /**
   * Get status of all jobs
   */
  getStatus() {
    return {
      initialized: this.initialized,
      totalJobs: this.jobs.length,
      jobs: this.jobs.map(({ name, schedule }) => ({ name, schedule }))
    };
  }
}

// Export singleton instance
module.exports = new ReminderScheduler();
