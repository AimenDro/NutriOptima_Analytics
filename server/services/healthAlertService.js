const HealthAlert = require('../models/HealthAlert');
const User = require('../models/User');
const DailyTracking = require('../models/DailyTracking');
const { HEALTH_RULES, getRDAForUser, DEFICIENCY_THRESHOLDS } = require('../config/healthRules');

/**
 * Check food entry against user's health conditions
 * Returns immediate alerts if food violates health rules
 */
async function checkFoodForHealthRisks(userId, foodEntry, userOverride = null) {
  try {
    console.log('🔍 checkFoodForHealthRisks called with:', { userId, foodEntry });
    
    const user = userOverride || await User.findById(userId);
    if (!user) {
      console.log('⚠️ No user found');
      return [];
    }

    const conditions = (user.healthConditions || []).filter(c =>
      c && c !== 'nill' && c !== 'nil' && c !== 'none' && c !== 'None'
    );
    const allergies = (user.allergies || []).filter(a =>
      a && a !== 'nill' && a !== 'nil' && a !== 'none'
    );

    if (conditions.length === 0 && allergies.length === 0) {
      console.log('⚠️ No health conditions or allergies to check');
      return [];
    }

    console.log('👤 Checking conditions:', conditions, 'allergies:', allergies);

    const alerts = [];

    // ── Allergy Check ──────────────────────────────────────────────
    if (allergies.length > 0) {
      const foodNameLower = (foodEntry.name || foodEntry.foodName || '').toLowerCase();
      for (const allergy of allergies) {
        const allergyLower = allergy.toLowerCase();
        if (foodNameLower.includes(allergyLower) || allergyLower.includes(foodNameLower)) {
          alerts.push({
            userId: user._id,
            userEmail: user.email,
            alertType: 'allergy',
            severity: 'critical',
            condition: 'allergy',
            foodName: foodEntry.name || foodEntry.foodName,
            nutrient: 'allergen',
            amount: 1,
            threshold: 0,
            unit: '',
            message: `🚨 ALLERGY ALERT: "${foodEntry.name || foodEntry.foodName}" contains ${allergy} which you are allergic to!`,
            details: `You have logged a food that contains ${allergy}. This may cause an allergic reaction. Please remove this food immediately.`
          });
        }
      }
    }

    // ── Health Condition Check ─────────────────────────────────────
    for (const condition of conditions) {
      const rules = HEALTH_RULES[condition];
      if (!rules) {
        console.log(`⚠️ No rules found for condition: ${condition}`);
        continue;
      }

      console.log(`📋 Checking rules for ${condition}:`, rules.avoid);

      // Check each nutrient in the food against avoid rules
      for (const [nutrient, rule] of Object.entries(rules.avoid)) {
        const foodNutrientValue = foodEntry[nutrient] || 0;
        
        console.log(`   Checking ${nutrient}: ${foodNutrientValue} vs threshold ${rule.threshold}`);

        if (foodNutrientValue > rule.threshold) {
          console.log(`   ⚠️ ALERT! ${nutrient} exceeds threshold`);
          
          const alert = {
            userId: user._id,
            userEmail: user.email,
            alertType: 'health_condition',
            severity: rule.severity,
            condition: condition,
            foodName: foodEntry.name || foodEntry.foodName,
            nutrient: nutrient,
            amount: foodNutrientValue,
            threshold: rule.threshold,
            unit: rule.unit,
            message: `⚠️ ${rule.message} (${foodNutrientValue}${rule.unit})`,
            details: `This food contains ${foodNutrientValue}${rule.unit} of ${nutrient}, which exceeds the safe threshold of ${rule.threshold}${rule.unit} for ${rules.name}.`
          };
          
          alerts.push(alert);
        }
      }
    }

    console.log(`✅ Generated ${alerts.length} alerts`);

    // Save alerts to database
    if (alerts.length > 0) {
      console.log('💾 Saving alerts to database:', alerts);
      const savedAlerts = await HealthAlert.insertMany(alerts);
      console.log('✅ Alerts saved:', savedAlerts.length);
      return savedAlerts;
    }

    return alerts;
  } catch (error) {
    console.error('❌ Error checking food for health risks:', error);
    return [];
  }
}

/**
 * Check daily totals against health condition limits
 * Called at end of day or when viewing daily summary
 */
async function checkDailyLimits(userId, date = new Date()) {
  try {
    const user = await User.findById(userId);
    if (!user || !user.healthConditions || user.healthConditions.length === 0) {
      return [];
    }

    // Get today's tracking
    const tracking = await DailyTracking.findOne({
      userId,
      date: {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      }
    });

    if (!tracking) {
      return [];
    }

    const alerts = [];

    // Check each health condition
    for (const condition of user.healthConditions) {
      if (condition === 'none') continue;

      const rules = HEALTH_RULES[condition];
      if (!rules || !rules.dailyLimits) continue;

      // Check each daily limit
      for (const [nutrient, limit] of Object.entries(rules.dailyLimits)) {
        const consumedAmount = tracking.consumed[nutrient] || 0;

        if (consumedAmount > limit.max) {
          const excess = consumedAmount - limit.max;
          alerts.push({
            userId: user._id,
            userEmail: user.email,
            alertType: 'daily_limit_exceeded',
            severity: 'warning',
            condition: condition,
            nutrient: nutrient,
            amount: consumedAmount,
            threshold: limit.max,
            unit: limit.unit,
            message: `⚠️ ${limit.message}`,
            details: `You consumed ${consumedAmount}${limit.unit} of ${nutrient} today, exceeding the recommended limit of ${limit.max}${limit.unit} by ${excess.toFixed(1)}${limit.unit}.`
          });
        }
      }
    }

    // Save alerts to database
    if (alerts.length > 0) {
      await HealthAlert.insertMany(alerts);
    }

    return alerts;
  } catch (error) {
    console.error('Error checking daily limits:', error);
    return [];
  }
}

/**
 * Food suggestions for each nutrient deficiency
 */
const NUTRIENT_FOOD_SUGGESTIONS = {
  vitaminC:   { foods: ['oranges', 'kiwi', 'bell peppers', 'strawberries', 'guava', 'broccoli'], tip: 'Eat citrus fruits or raw vegetables daily.' },
  vitaminA:   { foods: ['carrots', 'spinach', 'mango', 'eggs', 'sweet potato'], tip: 'Include orange/yellow vegetables and leafy greens.' },
  vitaminD:   { foods: ['fish (salmon, tuna)', 'eggs', 'fortified milk'], tip: 'Get 15-20 min of sunlight daily and eat fatty fish.' },
  vitaminE:   { foods: ['almonds', 'sunflower seeds', 'spinach', 'avocado'], tip: 'Add a handful of nuts to your daily diet.' },
  vitaminK:   { foods: ['spinach', 'broccoli', 'cabbage', 'kale'], tip: 'Include leafy green vegetables in every meal.' },
  vitaminB12: { foods: ['eggs', 'chicken', 'beef', 'fish', 'milk', 'yogurt'], tip: 'Animal products are the main source — eat them daily.' },
  calcium:    { foods: ['milk', 'yogurt', 'cheese', 'spinach', 'broccoli', 'almonds'], tip: 'Drink 2 glasses of milk or eat dairy daily.' },
  iron:       { foods: ['beef', 'lentils (daal)', 'spinach', 'peas', 'chicken'], tip: 'Pair iron-rich foods with Vitamin C for better absorption.' },
  magnesium:  { foods: ['nuts', 'spinach', 'bananas', 'oats', 'lentils'], tip: 'Eat whole grains and nuts regularly.' },
  zinc:       { foods: ['beef', 'chicken', 'lentils', 'nuts', 'oats'], tip: 'Include lean meats or legumes in your meals.' },
  fiber:      { foods: ['whole wheat roti', 'oats', 'lentils', 'vegetables', 'fruits'], tip: 'Replace refined grains with whole grains.' },
};

/**
 * Check for nutrient deficiencies over a period (default 7 days)
 */
async function checkNutrientDeficiencies(userId, days = 7) {
  try {
    const user = await User.findById(userId);
    if (!user) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const trackingData = await DailyTracking.find({
      userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    if (trackingData.length === 0) return [];

    // Calculate averages from consumed totals
    const microKeys = ['vitaminC','vitaminA','vitaminD','vitaminE','vitaminK','vitaminB12','calcium','iron','magnesium','zinc','fiber'];
    const totals = {};
    microKeys.forEach(k => totals[k] = 0);

    trackingData.forEach(day => {
      microKeys.forEach(k => {
        totals[k] += day.consumed[k] || 0;
      });
    });

    const averages = {};
    microKeys.forEach(k => {
      averages[k] = totals[k] / trackingData.length;
    });

    const rda = getRDAForUser(user);
    const alerts = [];

    for (const [nutrient, rdaInfo] of Object.entries(rda)) {
      const avgIntake = averages[nutrient] || 0;
      if (avgIntake === 0) continue; // skip if no data at all

      const percentage = (avgIntake / rdaInfo.min) * 100;
      let severity = null;

      if (percentage < DEFICIENCY_THRESHOLDS.critical) severity = 'critical';
      else if (percentage < DEFICIENCY_THRESHOLDS.warning) severity = 'warning';
      else if (percentage < DEFICIENCY_THRESHOLDS.low) severity = 'info';

      if (!severity) continue;

      // Count days below threshold
      let daysBelow = 0;
      trackingData.forEach(day => {
        if ((day.consumed[nutrient] || 0) < rdaInfo.min) daysBelow++;
      });

      if (daysBelow < 3) continue; // need at least 3 days of data

      const suggestion = NUTRIENT_FOOD_SUGGESTIONS[nutrient];
      const suggestedFoods = suggestion?.foods || [];
      const actionTip = suggestion?.tip || '';

      alerts.push({
        userId: user._id,
        userEmail: user.email,
        alertType: 'nutrient_deficiency',
        severity,
        deficientNutrient: nutrient,
        currentIntake: parseFloat(avgIntake.toFixed(2)),
        recommendedIntake: rdaInfo.min,
        percentage: Math.round(percentage),
        daysBelow,
        unit: rdaInfo.unit,
        message: severity === 'critical'
          ? `🚨 Critical: Low ${rdaInfo.name} (${Math.round(percentage)}% of daily goal)`
          : `⚠️ Low ${rdaInfo.name} this week (${Math.round(percentage)}% of daily goal)`,
        details: `Your average ${rdaInfo.name} intake is ${avgIntake.toFixed(1)}${rdaInfo.unit}/day — ${Math.round(percentage)}% of the recommended ${rdaInfo.min}${rdaInfo.unit}. You've been below target for ${daysBelow} of the last ${trackingData.length} days.`,
        suggestedFoods,
        actionTip
      });
    }

    if (alerts.length > 0) {
      // Avoid duplicate alerts — only insert if no similar alert in last 24h
      const recentAlerts = await HealthAlert.find({
        userId: user._id,
        alertType: 'nutrient_deficiency',
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }).lean();
      const recentNutrients = new Set(recentAlerts.map(a => a.deficientNutrient));
      const newAlerts = alerts.filter(a => !recentNutrients.has(a.deficientNutrient));
      if (newAlerts.length > 0) await HealthAlert.insertMany(newAlerts);
      return newAlerts;
    }

    return alerts;
  } catch (error) {
    console.error('Error checking nutrient deficiencies:', error);
    return [];
  }
}

/**
 * Calculate average nutrient intake from tracking data
 */
function calculateNutrientAverages(trackingData) {
  const totals = {};
  const counts = {};

  trackingData.forEach(day => {
    // Check if consumed exists and has micronutrients
    if (day.consumed && day.consumed.micronutrients) {
      for (const [nutrient, value] of Object.entries(day.consumed.micronutrients)) {
        totals[nutrient] = (totals[nutrient] || 0) + (value || 0);
        counts[nutrient] = (counts[nutrient] || 0) + 1;
      }
    }
  });

  const averages = {};
  for (const nutrient in totals) {
    averages[nutrient] = totals[nutrient] / (counts[nutrient] || 1);
  }

  return averages;
}

/**
 * Count how many days intake was below threshold
 */
function countDaysBelowThreshold(trackingData, nutrient, threshold) {
  let count = 0;
  trackingData.forEach(day => {
    const intake = day.consumed?.micronutrients?.[nutrient] || 0;
    if (intake < threshold) {
      count++;
    }
  });
  return count;
}

/**
 * Get all active alerts for a user
 */
async function getActiveAlerts(userId) {
  try {
    return await HealthAlert.find({
      userId,
      acknowledged: false
    }).sort({ severity: -1, createdAt: -1 });
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
}

/**
 * Get alerts by severity
 */
async function getAlertsBySeverity(userId, severity) {
  try {
    return await HealthAlert.find({
      userId,
      severity,
      acknowledged: false
    }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error getting alerts by severity:', error);
    return [];
  }
}

/**
 * Acknowledge an alert
 */
async function acknowledgeAlert(alertId) {
  try {
    const alert = await HealthAlert.findById(alertId);
    if (alert) {
      return await alert.acknowledge();
    }
    return null;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return null;
  }
}

/**
 * Delete/dismiss an alert
 */
async function dismissAlert(alertId) {
  try {
    return await HealthAlert.findByIdAndDelete(alertId);
  } catch (error) {
    console.error('Error dismissing alert:', error);
    return null;
  }
}

/**
 * Get alert statistics for dashboard
 */
async function getAlertStats(userId) {
  try {
    const alerts = await HealthAlert.find({ userId, acknowledged: false });
    
    return {
      total: alerts.length,
      critical: alerts.filter(a => a.severity === 'critical').length,
      warning: alerts.filter(a => a.severity === 'warning').length,
      info: alerts.filter(a => a.severity === 'info').length,
      byType: {
        health_condition: alerts.filter(a => a.alertType === 'health_condition').length,
        nutrient_deficiency: alerts.filter(a => a.alertType === 'nutrient_deficiency').length,
        daily_limit_exceeded: alerts.filter(a => a.alertType === 'daily_limit_exceeded').length
      }
    };
  } catch (error) {
    console.error('Error getting alert stats:', error);
    return { total: 0, critical: 0, warning: 0, info: 0, byType: {} };
  }
}

module.exports = {
  checkFoodForHealthRisks,
  checkDailyLimits,
  checkNutrientDeficiencies,
  getActiveAlerts,
  getAlertsBySeverity,
  acknowledgeAlert,
  dismissAlert,
  getAlertStats
};
