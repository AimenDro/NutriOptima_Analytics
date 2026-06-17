const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const axios = require('axios');
  try {
    console.log('Testing /api/diet/generate-plan...');
    const res = await axios.post('http://localhost:5001/api/diet/generate-plan', {
      userId: '69dfdfcea93dec9845cfd1d5',
      userEmail: 'aimenm861@gmail.com',
      userProfile: {
        age: 25, gender: 'female', weight: 60, height: 165,
        activityLevel: 'moderately_active', goal: 'maintain',
        diseases: [], allergies: [], dietaryRestrictions: [],
        cuisinePreference: 'pakistani', mealsPerDay: 3
      }
    }, { timeout: 60000 });

    console.log('✅ Success!');
    console.log('Source:', res.data.data?.dietPlan?.generatedBy || 'gemini');
    console.log('Meals:', res.data.data?.dietPlan?.plan?.meals?.length || 0);
    console.log('Plan ID:', res.data.data?.savedPlanId);
  } catch (e) {
    console.log('❌ Error:', e.response?.data?.error?.message || e.message);
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
