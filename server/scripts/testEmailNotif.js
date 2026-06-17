const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = require('../models/User');
  const emailService = require('../services/emailService');

  // Test saving preferences
  const user = await User.findOne({ email: 'hina98@gmail.com' });
  if (!user) { console.log('User not found'); process.exit(1); }

  // Toggle one pref and save using updateOne (bypasses validation on other fields)
  await User.updateOne(
    { _id: user._id },
    { $set: { 'emailNotifications.mealReminders': true } }
  );
  const updated = await User.findById(user._id).lean();
  console.log('✅ Preferences saved successfully for', user.email);
  console.log('Prefs:', updated.emailNotifications);

  // Send a test meal reminder email
  console.log('\n📧 Sending test meal reminder email...');
  const result = await emailService.sendMealReminder(user.email, user.name || 'User', 'breakfast');
  console.log('Email result:', result);

  process.exit(0);
}).catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
