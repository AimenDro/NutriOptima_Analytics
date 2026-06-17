const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const DietPlan = require('../models/DietPlan');

  // Get all plans grouped by user
  const plans = await DietPlan.find({}).sort({ userEmail: 1, createdAt: 1 });

  const userPlanCount = {};
  for (const plan of plans) {
    const key = plan.userEmail || plan.userId?.toString();
    userPlanCount[key] = (userPlanCount[key] || 0) + 1;
    const num = userPlanCount[key];
    const date = new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    await DietPlan.updateOne(
      { _id: plan._id },
      { $set: { planNumber: num, planName: `Diet Plan #${num} - ${date}` } }
    );
    console.log(`Updated: ${plan.userEmail} → Plan #${num} (${date})`);
  }

  // Final check
  const updated = await DietPlan.find({}, 'userEmail planNumber planName createdAt targets').lean();
  console.log('\n=== ALL DIET PLANS ===');
  updated.forEach(p => {
    console.log(`${p.userEmail} | ${p.planName} | calories target: ${p.targets?.calories || 'N/A'}`);
  });

  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
