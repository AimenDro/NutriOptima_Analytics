const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('../models/User');
  const emailService = require('../services/emailService');

  const users = await User.find({}, 'email name emailNotifications').lean();
  console.log(`Found ${users.length} users\n`);

  for (const user of users) {
    console.log(`\n📧 Sending test notification to: ${user.email}`);
    console.log(`   Preferences:`, user.emailNotifications);

    if (user.emailNotifications?.mealReminders !== false) {
      const r = await emailService.sendMealReminder(user.email, user.name || user.email.split('@')[0], 'breakfast');
      console.log(`   Meal reminder: ${r.success ? '✅ sent' : '❌ ' + r.message}`);
    } else {
      console.log(`   Meal reminder: ⏭️ skipped (opted out)`);
    }

    if (user.emailNotifications?.dailySummary !== false) {
      const r = await emailService.sendDailySummary(user.email, user.name || user.email.split('@')[0], {
        calories: { consumed: 1450, goal: 2000 },
        protein:  { consumed: 85,   goal: 120  },
        carbs:    { consumed: 180,  goal: 250  },
        fats:     { consumed: 45,   goal: 65   },
        water:    { consumed: 1.5,  goal: 2.5  },
        goalAchieved: false
      });
      console.log(`   Daily summary: ${r.success ? '✅ sent' : '❌ ' + r.message}`);
    } else {
      console.log(`   Daily summary: ⏭️ skipped (opted out)`);
    }
  }

  console.log('\n✅ Done');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
