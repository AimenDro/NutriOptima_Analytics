const express = require('express');
const DailyTracking = require('../models/DailyTracking');
const DietPlan = require('../models/DietPlan');
const User = require('../models/User');
const { checkFoodForHealthRisks } = require('../services/healthAlertService');
const router = express.Router();

// Helper to get today's date at midnight
const getTodayDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

// POST /api/tracking/initialize - Initialize tracking from diet plan
router.post('/initialize', async (req, res) => {
  try {
    const { userId, userEmail, dietPlanId, forceReinit } = req.body;

    if (!userId || !userEmail) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and userEmail required' }
      });
    }

    // Get the specified diet plan or latest
    let dietPlan;
    if (dietPlanId) {
      dietPlan = await DietPlan.findById(dietPlanId);
    } else {
      try {
        dietPlan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });
      } catch (err) {
        dietPlan = await DietPlan.findOne({ userEmail }).sort({ createdAt: -1 });
      }
    }

    if (!dietPlan || !dietPlan.targets) {
      return res.status(404).json({
        success: false,
        error: { code: 'NO_DIET_PLAN', message: 'No diet plan found. Please generate a diet plan first.' }
      });
    }

    const today = getTodayDate();
    let tracking = await DailyTracking.findOne({ userEmail, date: today });

    // If tracking exists and not forcing reinit, return existing
    if (tracking && !forceReinit) {
      return res.json({
        success: true,
        data: { tracking, message: 'Tracking already initialized for today' }
      });
    }

    let waterIntake = 2.5;
    if (dietPlan.nlpAdvice?.calculations?.waterIntake) {
      waterIntake = parseFloat(dietPlan.nlpAdvice.calculations.waterIntake);
    }

    const goals = {
      calories: dietPlan.targets.calories,
      protein: dietPlan.targets.protein,
      carbs: dietPlan.targets.carbs,
      fats: dietPlan.targets.fat,
      water: waterIntake
    };

    if (tracking && forceReinit) {
      // Update goals on existing tracking and record which plan is active
      tracking.goals = goals;
      tracking.dietPlanId = dietPlan._id;
      await tracking.save();
    } else {
      // Create new tracking
      tracking = new DailyTracking({
        userId,
        userEmail,
        date: today,
        dietPlanId: dietPlan._id,
        goals
      });
      await tracking.save();
    }

    res.json({
      success: true,
      data: { tracking },
      message: forceReinit ? 'Diet plan applied successfully' : 'Daily tracking initialized successfully'
    });

  } catch (error) {
    console.error('Initialize tracking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/tracking/today/:userId - Get today's tracking
router.get('/today/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const today = getTodayDate();

    // Try to find by userId first, then by userEmail if userId is actually an email
    let tracking;
    if (userId.includes('@')) {
      tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
    } else {
      tracking = await DailyTracking.findOne({ userId, date: today });
      if (!tracking) {
        // Try as email fallback
        tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
      }
    }

    if (!tracking) {
      return res.json({
        success: true,
        data: { tracking: null, needsInitialization: true },
        message: 'No tracking found for today'
      });
    }

    const progress = tracking.getProgress();

    res.json({
      success: true,
      data: { tracking, progress }
    });

  } catch (error) {
    console.error('Get tracking error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/tracking/add-food - Add food entry (manual or AI)
router.post('/add-food', async (req, res) => {
  try {
    const { userId, foodEntry } = req.body;

    console.log('📝 Add food request:', { userId, foodEntry });

    if (!userId || !foodEntry) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and foodEntry required' }
      });
    }

    const today = getTodayDate();
    
    // Try to find tracking by userId or userEmail
    let tracking;
    if (userId.includes('@')) {
      tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
    } else {
      tracking = await DailyTracking.findOne({ userId, date: today });
      if (!tracking) {
        // Try as email fallback
        tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
      }
    }

    if (!tracking) {
      console.log('⚠️ No tracking found for userId:', userId, '— auto-initializing with defaults');

      // Look up user to get email
      let userEmail = userId.includes('@') ? userId : null;
      let userRecord = null;
      if (!userEmail) {
        userRecord = await User.findById(userId).catch(() => null);
        userEmail = userRecord?.email || userId;
      }

      // Try to get goals from latest diet plan
      let goals = { calories: 2000, protein: 150, carbs: 250, fats: 65, water: 2.5 };
      try {
        const latestPlan = await DietPlan.findOne({
          $or: [{ userId }, { userEmail }]
        }).sort({ createdAt: -1 });
        if (latestPlan?.targets) {
          goals = {
            calories: latestPlan.targets.calories || 2000,
            protein:  latestPlan.targets.protein  || 150,
            carbs:    latestPlan.targets.carbs     || 250,
            fats:     latestPlan.targets.fats      || 65,
            water:    latestPlan.targets.water     || 2.5,
          };
        }
      } catch (_) {}

      tracking = new DailyTracking({
        userId: userId.includes('@') ? undefined : userId,
        userEmail,
        date: today,
        goals,
        consumed: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },
        foodEntries: [],
        waterEntries: [],
      });
      await tracking.save();
      console.log('✅ Auto-initialized tracking for:', userEmail);
    }

    console.log('✅ Found tracking:', tracking._id);

    // Check for health alerts BEFORE adding food
    let healthAlerts = [];
    try {
      // Get user by ID or email
      let user = null;
      if (userId && !userId.includes('@')) {
        user = await User.findById(userId).catch(() => null);
      }
      if (!user) {
        const tracking2 = await DailyTracking.findOne({ $or: [{ userId }, { userEmail: userId }], date: today });
        if (tracking2?.userEmail) {
          user = await User.findOne({ email: tracking2.userEmail });
        }
      }

      if (user) {
        console.log('🏥 Checking food for user:', user.email, 'conditions:', user.healthConditions, 'allergies:', user.allergies);

        // Enrich foodEntry with sugar estimate for diabetes check
        const enrichedForCheck = { ...foodEntry };
        if (!enrichedForCheck.sugar && enrichedForCheck.carbs) {
          const sweetKeywords = ['sugar', 'sweet', 'cake', 'chocolate', 'candy', 'juice', 'soda', 'cookie', 'dessert', 'ice cream', 'tea'];
          const isSweetFood = sweetKeywords.some(k => (foodEntry.name || '').toLowerCase().includes(k));
          enrichedForCheck.sugar = isSweetFood ? Math.round(enrichedForCheck.carbs * 0.6) : Math.round(enrichedForCheck.carbs * 0.1);
        }

        // Fix: normalize health conditions — treat 'nill'/'nil'/'none' as empty
        const normalizedConditions = (user.healthConditions || []).filter(c =>
          c && c !== 'nill' && c !== 'nil' && c !== 'none' && c !== 'None' && c !== 'NONE'
        );

        // Temporarily override user conditions for the check
        const userForCheck = { ...user.toObject(), healthConditions: normalizedConditions };
        healthAlerts = await checkFoodForHealthRisks(user._id.toString(), enrichedForCheck, userForCheck);
        console.log('⚠️ Health alerts generated:', healthAlerts.length);
      }
    } catch (alertError) {
      console.warn('⚠️ Failed to check health alerts:', alertError.message);
    }

    // Add food entry with micronutrient estimation
    const { estimateMicronutrients } = require('../services/micronutrientEstimator');
    const micronutrients = estimateMicronutrients(foodEntry.name, foodEntry.calories);
    const enrichedEntry = { ...foodEntry, ...micronutrients };
    tracking.foodEntries.push(enrichedEntry);

    // Update consumed totals (macros + micronutrients)
    tracking.consumed.calories  += foodEntry.calories || 0;
    tracking.consumed.protein   += foodEntry.protein  || 0;
    tracking.consumed.carbs     += foodEntry.carbs    || 0;
    tracking.consumed.fats      += foodEntry.fats     || 0;
    tracking.consumed.fiber     += foodEntry.fiber    || micronutrients.fiber    || 0;
    tracking.consumed.sugar     += foodEntry.sugar    || 0;
    tracking.consumed.sodium    += foodEntry.sodium   || 0;
    tracking.consumed.vitaminC  += micronutrients.vitaminC  || 0;
    tracking.consumed.vitaminA  += micronutrients.vitaminA  || 0;
    tracking.consumed.vitaminD  += micronutrients.vitaminD  || 0;
    tracking.consumed.vitaminE  += micronutrients.vitaminE  || 0;
    tracking.consumed.vitaminK  += micronutrients.vitaminK  || 0;
    tracking.consumed.vitaminB12+= micronutrients.vitaminB12|| 0;
    tracking.consumed.calcium   += micronutrients.calcium   || 0;
    tracking.consumed.iron      += micronutrients.iron      || 0;
    tracking.consumed.magnesium += micronutrients.magnesium || 0;
    tracking.consumed.zinc      += micronutrients.zinc      || 0;

    // Check if goals achieved
    tracking.goalAchieved.calories = tracking.consumed.calories >= tracking.goals.calories;

    // Add warnings if needed
    const caloriePercentage = (tracking.consumed.calories / tracking.goals.calories) * 100;
    if (caloriePercentage > 120) {
      tracking.warnings.push({
        type: 'calorie_excess',
        message: `You've exceeded your daily calorie goal by ${Math.round(caloriePercentage - 100)}%`
      });
    }

    await tracking.save();

    const progress = tracking.getProgress();

    // Run deficiency check (async, don't block response)
    const { checkNutrientDeficiencies } = require('../services/healthAlertService');
    let deficiencyAlerts = [];
    try {
      deficiencyAlerts = await checkNutrientDeficiencies(tracking.userId, 7);
    } catch (e) {
      console.warn('Deficiency check failed:', e.message);
    }

    const allAlerts = [...healthAlerts, ...deficiencyAlerts];

    console.log('✅ Food added successfully. New totals:', tracking.consumed);

    res.json({
      success: true,
      data: {
        tracking,
        progress,
        healthAlerts: allAlerts
      },
      message: allAlerts.length > 0
        ? `Food added with ${allAlerts.length} health alert(s)`
        : 'Food entry added successfully'
    });

  } catch (error) {
    console.error('❌ Add food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/tracking/lookup-food - Lookup food nutrition by name
router.post('/lookup-food', async (req, res) => {
  try {
    const { foodName, quantity } = req.body;

    if (!foodName) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'foodName required' }
      });
    }

    // Use Groq for food nutrition lookup (works without VPN)
    const groqService = require('../services/groqService');

    if (groqService.isAvailable()) {
      try {
        const qty = quantity || '100g';
        const completion = await groqService.client.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a nutrition expert. Return ONLY valid JSON, no extra text.' },
            { role: 'user', content: `Provide nutrition info for: "${foodName}" (${qty}). Return JSON: {"foodName":"${foodName}","quantity":"${qty}","calories":0,"protein":0,"carbs":0,"fats":0,"fiber":0,"sugar":0,"sodium":0,"confidence":"high"}` }
          ],
          max_tokens: 200,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        });

        let text = completion.choices[0].message.content.trim();
        const nutritionData = JSON.parse(text);

        return res.json({
          success: true,
          data: nutritionData
        });
      } catch (groqError) {
        console.warn('Groq food lookup failed:', groqError.message);
      }
    }

    // Fallback — use micronutrient estimator + basic nutrition lookup
    const { estimateMicronutrients } = require('../services/micronutrientEstimator');
    const basicNutrition = {
      egg: { calories: 155, protein: 13, carbs: 1.1, fats: 11, fiber: 0 },
      chicken: { calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0 },
      rice: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, fiber: 0.4 },
      roti: { calories: 120, protein: 3.5, carbs: 24, fats: 1.5, fiber: 2 },
      daal: { calories: 116, protein: 9, carbs: 20, fats: 0.4, fiber: 8 },
      milk: { calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, fiber: 0 },
      banana: { calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6 },
      apple: { calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4 },
      bread: { calories: 265, protein: 9, carbs: 49, fats: 3.2, fiber: 2.7 },
      potato: { calories: 77, protein: 2, carbs: 17, fats: 0.1, fiber: 2.2 },
      tomato: { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2 },
      spinach: { calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2 },
      yogurt: { calories: 59, protein: 3.5, carbs: 5, fats: 3.3, fiber: 0 },
      cheese: { calories: 402, protein: 25, carbs: 1.3, fats: 33, fiber: 0 },
      fish: { calories: 136, protein: 20, carbs: 0, fats: 6, fiber: 0 },
      beef: { calories: 250, protein: 26, carbs: 0, fats: 15, fiber: 0 },
      oats: { calories: 389, protein: 17, carbs: 66, fats: 7, fiber: 10 },
    };

    const key = Object.keys(basicNutrition).find(k => foodName.toLowerCase().includes(k));
    const nutrition = key ? basicNutrition[key] : { calories: 100, protein: 3, carbs: 15, fats: 3, fiber: 1 };

    return res.json({
      success: true,
      data: {
        foodName,
        quantity: quantity || '100g',
        ...nutrition,
        sugar: 0,
        sodium: 0,
        confidence: key ? 'medium' : 'low'
      }
    });

  } catch (error) {
    console.error('Food lookup error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/tracking/add-water - Add water entry
router.post('/add-water', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId and amount required' }
      });
    }

    const today = getTodayDate();
    let tracking = await DailyTracking.findOne({ userId, date: today });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_INITIALIZED', message: 'Please initialize tracking first' }
      });
    }

    // Add water entry
    tracking.waterEntries.push({ amount });
    tracking.consumed.water += amount;

    // Check if goal achieved
    tracking.goalAchieved.water = tracking.consumed.water >= tracking.goals.water;

    await tracking.save();

    const progress = tracking.getProgress();

    res.json({
      success: true,
      data: { tracking, progress },
      message: 'Water entry added successfully'
    });

  } catch (error) {
    console.error('Add water error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// POST /api/tracking/check-goals - Check end-of-day goals
router.post('/check-goals', async (req, res) => {
  try {
    const { userId } = req.body;
    const today = getTodayDate();

    let tracking = await DailyTracking.findOne({ userId, date: today });

    if (!tracking) {
      return res.json({
        success: true,
        data: { warnings: [] },
        message: 'No tracking found'
      });
    }

    const warnings = [];

    // Check calorie goal
    if (!tracking.goalAchieved.calories) {
      const deficit = tracking.goals.calories - tracking.consumed.calories;
      warnings.push({
        type: 'calorie_deficit',
        message: `Daily calorie goal not achieved. You're ${deficit} kcal short.`,
        severity: 'warning'
      });
    }

    // Check water goal
    if (!tracking.goalAchieved.water) {
      const deficit = (tracking.goals.water - tracking.consumed.water).toFixed(1);
      warnings.push({
        type: 'water_deficit',
        message: `Daily water goal not achieved. You need ${deficit}L more water.`,
        severity: 'warning'
      });
    }

    res.json({
      success: true,
      data: {
        warnings,
        goalAchieved: tracking.goalAchieved,
        progress: tracking.getProgress()
      }
    });

  } catch (error) {
    console.error('Check goals error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// DELETE /api/tracking/food/:userId/:entryId - Delete food entry
router.delete('/food/:userId/:entryId', async (req, res) => {
  try {
    const { userId, entryId } = req.params;
    const today = getTodayDate();

    let tracking = await DailyTracking.findOne({ userId, date: today });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tracking not found' }
      });
    }

    const entry = tracking.foodEntries.id(entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Food entry not found' }
      });
    }

    // Subtract from consumed totals
    tracking.consumed.calories -= entry.calories || 0;
    tracking.consumed.protein -= entry.protein || 0;
    tracking.consumed.carbs -= entry.carbs || 0;
    tracking.consumed.fats -= entry.fats || 0;

    // Remove entry
    tracking.foodEntries.pull(entryId);

    // Update goal status
    tracking.goalAchieved.calories = tracking.consumed.calories >= tracking.goals.calories;

    await tracking.save();

    const progress = tracking.getProgress();

    res.json({
      success: true,
      data: { tracking, progress },
      message: 'Food entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete food error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// DELETE /api/tracking/water/:userId/:entryId - Delete water entry
router.delete('/water/:userId/:entryId', async (req, res) => {
  try {
    const { userId, entryId } = req.params;
    const today = getTodayDate();

    // Try to find by userId or userEmail
    let tracking;
    if (userId.includes('@')) {
      tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
    } else {
      tracking = await DailyTracking.findOne({ userId, date: today });
      if (!tracking) {
        tracking = await DailyTracking.findOne({ userEmail: userId, date: today });
      }
    }

    if (!tracking) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Tracking not found' }
      });
    }

    const entry = tracking.waterEntries.id(entryId);
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Water entry not found' }
      });
    }

    // Subtract from consumed total
    tracking.consumed.water -= entry.amount || 0;

    // Remove entry
    tracking.waterEntries.pull(entryId);

    // Update goal status
    tracking.goalAchieved.water = tracking.consumed.water >= tracking.goals.water;

    await tracking.save();

    const progress = tracking.getProgress();

    res.json({
      success: true,
      data: { tracking, progress },
      message: 'Water entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete water error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

// GET /api/tracking/analytics/:userId - Get analytics data
router.get('/analytics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'week' } = req.query; // day, week, month

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setDate(startDate.getDate() - 30);
    }

    const trackingData = await DailyTracking.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    // Calculate analytics
    const analytics = {
      period,
      totalDays: trackingData.length,
      averages: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: 0
      },
      totals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        water: 0
      },
      goalAchievement: {
        caloriesAchieved: 0,
        waterAchieved: 0
      },
      dailyData: [],
      nutrientTrends: {
        calories: [],
        protein: [],
        carbs: [],
        fats: [],
        water: []
      }
    };

    trackingData.forEach(day => {
      analytics.totals.calories += day.consumed.calories;
      analytics.totals.protein += day.consumed.protein;
      analytics.totals.carbs += day.consumed.carbs;
      analytics.totals.fats += day.consumed.fats;
      analytics.totals.water += day.consumed.water;

      if (day.goalAchieved.calories) analytics.goalAchievement.caloriesAchieved++;
      if (day.goalAchieved.water) analytics.goalAchievement.waterAchieved++;

      const dayData = {
        date: day.date,
        consumed: day.consumed,
        goals: day.goals,
        goalAchieved: day.goalAchieved,
        progress: day.getProgress()
      };

      analytics.dailyData.push(dayData);
      analytics.nutrientTrends.calories.push({ date: day.date, value: day.consumed.calories });
      analytics.nutrientTrends.protein.push({ date: day.date, value: day.consumed.protein });
      analytics.nutrientTrends.carbs.push({ date: day.date, value: day.consumed.carbs });
      analytics.nutrientTrends.fats.push({ date: day.date, value: day.consumed.fats });
      analytics.nutrientTrends.water.push({ date: day.date, value: day.consumed.water });
    });

    if (trackingData.length > 0) {
      analytics.averages.calories = Math.round(analytics.totals.calories / trackingData.length);
      analytics.averages.protein = Math.round(analytics.totals.protein / trackingData.length);
      analytics.averages.carbs = Math.round(analytics.totals.carbs / trackingData.length);
      analytics.averages.fats = Math.round(analytics.totals.fats / trackingData.length);
      analytics.averages.water = (analytics.totals.water / trackingData.length).toFixed(1);
    }

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message }
    });
  }
});

module.exports = router;
