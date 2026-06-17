const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('../models/User');

  // Set default emailNotifications for users that don't have it
  const result = await User.updateMany(
    { emailNotifications: { $exists: false } },
    {
      $set: {
        emailNotifications: {
          mealReminders: true,
          waterReminders: true,
          dietRecommendations: true,
          dailySummary: true,
          weeklySummary: true,
          monthlySummary: true
        }
      }
    }
  );

  console.log('Updated', result.modifiedCount, 'users with default email preferences');

  const users = await User.find({}, 'email emailNotifications').lean();
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
