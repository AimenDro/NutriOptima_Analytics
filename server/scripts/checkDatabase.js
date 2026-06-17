const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;

  // All diet plans per user
  const plans = await db.collection('dietplans').find({}, {
    projection: { userEmail: 1, createdAt: 1, planName: 1, totalCalories: 1, userId: 1 }
  }).toArray();
  console.log('=== DIET PLANS ===');
  console.log(JSON.stringify(plans, null, 2));

  // Diet plan count per user
  const planCounts = {};
  plans.forEach(p => {
    planCounts[p.userEmail] = (planCounts[p.userEmail] || 0) + 1;
  });
  console.log('\n=== DIET PLANS PER USER ===');
  console.log(JSON.stringify(planCounts, null, 2));

  // Food entries in daily trackings
  const allTrackings = await db.collection('dailytrackings').find({}).toArray();
  console.log('\n=== FOOD ENTRIES IN DAILY TRACKINGS ===');
  allTrackings.forEach(t => {
    console.log(`${t.userEmail} | ${t.date} | foodEntries: ${t.foodEntries?.length || 0}`);
    if (t.foodEntries?.length > 0) {
      t.foodEntries.forEach(f => console.log('  -', f.name, f.calories, 'kcal', f.quantity));
    }
  });

  process.exit(0);
}).catch(e => {
  console.error(e.message);
  process.exit(1);
});
