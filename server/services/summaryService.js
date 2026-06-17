const DailyTracking = require('../models/DailyTracking');
const User = require('../models/User');

/**
 * Generate weekly summary with intelligent feedback
 */
async function generateWeeklySummary(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get last 7 days of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const trackingData = await DailyTracking.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Calculate analytics
    const analytics = calculateAnalytics(trackingData, 7);
    
    // Calculate performance metrics
    const performance = calculatePerformance(analytics, trackingData);
    
    // Generate intelligent feedback
    const feedback = generateFeedback(performance, analytics, user);
    
    // Identify achievements
    const achievements = identifyAchievements(trackingData, performance);
    
    // Generate recommendations
    const recommendations = generateRecommendations(performance, analytics, user);

    return {
      period: 'week',
      startDate,
      endDate,
      user: {
        name: user.name || user.email.split('@')[0],
        email: user.email
      },
      performance,
      analytics,
      feedback,
      achievements,
      recommendations
    };
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    throw error;
  }
}

/**
 * Generate monthly summary with intelligent feedback
 */
async function generateMonthlySummary(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get last 30 days of data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const trackingData = await DailyTracking.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 });

    // Get previous month for comparison
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - 30);
    
    const previousMonthData = await DailyTracking.find({
      userId,
      date: { $gte: prevStartDate, $lt: startDate }
    });

    // Calculate analytics
    const analytics = calculateAnalytics(trackingData, 30);
    const previousAnalytics = calculateAnalytics(previousMonthData, 30);
    
    // Calculate performance metrics
    const performance = calculatePerformance(analytics, trackingData);
    
    // Calculate trends (comparison with previous month)
    const trends = calculateTrends(analytics, previousAnalytics);
    
    // Generate intelligent feedback
    const feedback = generateMonthlyFeedback(performance, analytics, trends, user);
    
    // Identify achievements
    const achievements = identifyMonthlyAchievements(trackingData, performance);
    
    // Generate recommendations
    const recommendations = generateMonthlyRecommendations(performance, analytics, trends, user);

    return {
      period: 'month',
      startDate,
      endDate,
      user: {
        name: user.name || user.email.split('@')[0],
        email: user.email
      },
      performance,
      analytics,
      trends,
      feedback,
      achievements,
      recommendations
    };
  } catch (error) {
    console.error('Error generating monthly summary:', error);
    throw error;
  }
}

/**
 * Calculate analytics from tracking data
 */
function calculateAnalytics(trackingData, totalDays) {
  const analytics = {
    totalDays: totalDays,
    daysLogged: trackingData.length,
    averages: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0, water: 0 },
    goalAchievement: { calories: 0, protein: 0, water: 0 }
  };

  if (trackingData.length === 0) {
    return analytics;
  }

  trackingData.forEach(day => {
    analytics.totals.calories += day.consumed.calories || 0;
    analytics.totals.protein += day.consumed.protein || 0;
    analytics.totals.carbs += day.consumed.carbs || 0;
    analytics.totals.fats += day.consumed.fats || 0;
    analytics.totals.water += day.consumed.water || 0;

    if (day.goalAchieved?.calories) analytics.goalAchievement.calories++;
    if (day.goalAchieved?.water) analytics.goalAchievement.water++;
    if (day.consumed.protein >= (day.goals.protein * 0.9)) analytics.goalAchievement.protein++;
  });

  analytics.averages.calories = Math.round(analytics.totals.calories / trackingData.length);
  analytics.averages.protein = Math.round(analytics.totals.protein / trackingData.length);
  analytics.averages.carbs = Math.round(analytics.totals.carbs / trackingData.length);
  analytics.averages.fats = Math.round(analytics.totals.fats / trackingData.length);
  analytics.averages.water = (analytics.totals.water / trackingData.length).toFixed(1);

  return analytics;
}

/**
 * Calculate performance metrics
 */
function calculatePerformance(analytics, trackingData) {
  const totalDays = analytics.totalDays;
  const daysLogged = analytics.daysLogged;

  return {
    consistency: Math.round((daysLogged / totalDays) * 100),
    calorieCompliance: Math.round((analytics.goalAchievement.calories / totalDays) * 100),
    proteinCompliance: Math.round((analytics.goalAchievement.protein / totalDays) * 100),
    waterCompliance: Math.round((analytics.goalAchievement.water / totalDays) * 100),
    longestStreak: calculateLongestStreak(trackingData),
    daysLogged,
    totalDays
  };
}

/**
 * Calculate longest logging streak
 */
function calculateLongestStreak(trackingData) {
  if (trackingData.length === 0) return 0;

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < trackingData.length; i++) {
    const prevDate = new Date(trackingData[i - 1].date);
    const currDate = new Date(trackingData[i].date);
    const dayDiff = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));

    if (dayDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Calculate trends (comparison with previous period)
 */
function calculateTrends(current, previous) {
  if (!previous || previous.daysLogged === 0) {
    return {
      calories: { change: 0, direction: 'same' },
      protein: { change: 0, direction: 'same' },
      water: { change: 0, direction: 'same' },
      consistency: { change: 0, direction: 'same' }
    };
  }

  const calorieChange = ((current.averages.calories - previous.averages.calories) / previous.averages.calories) * 100;
  const proteinChange = ((current.averages.protein - previous.averages.protein) / previous.averages.protein) * 100;
  const waterChange = ((parseFloat(current.averages.water) - parseFloat(previous.averages.water)) / parseFloat(previous.averages.water)) * 100;
  const consistencyChange = ((current.daysLogged - previous.daysLogged) / previous.daysLogged) * 100;

  return {
    calories: {
      change: Math.abs(Math.round(calorieChange)),
      direction: calorieChange > 5 ? 'up' : calorieChange < -5 ? 'down' : 'same'
    },
    protein: {
      change: Math.abs(Math.round(proteinChange)),
      direction: proteinChange > 5 ? 'up' : proteinChange < -5 ? 'down' : 'same'
    },
    water: {
      change: Math.abs(Math.round(waterChange)),
      direction: waterChange > 5 ? 'up' : waterChange < -5 ? 'down' : 'same'
    },
    consistency: {
      change: Math.abs(Math.round(consistencyChange)),
      direction: consistencyChange > 5 ? 'up' : consistencyChange < -5 ? 'down' : 'same'
    }
  };
}

/**
 * Generate intelligent feedback for weekly summary
 */
function generateFeedback(performance, analytics, user) {
  const feedback = [];

  // Overall performance
  if (performance.consistency >= 85 && performance.calorieCompliance >= 70) {
    feedback.push("🎉 Excellent week! You're consistently meeting your goals and staying on track.");
  } else if (performance.consistency >= 70) {
    feedback.push("👍 Good job this week! You're maintaining solid consistency.");
  } else if (performance.consistency >= 50) {
    feedback.push("💪 You're making progress! Let's work on logging more consistently.");
  } else {
    feedback.push("📝 Let's focus on building a daily logging habit. Consistency is key!");
  }

  // Calorie feedback
  if (performance.calorieCompliance >= 80) {
    feedback.push("✅ Great calorie management! You're hitting your targets consistently.");
  } else if (performance.calorieCompliance >= 60) {
    feedback.push("📊 Your calorie tracking is good, but there's room for improvement.");
  } else {
    feedback.push("🎯 Focus on meeting your calorie goals more consistently.");
  }

  // Protein feedback
  if (performance.proteinCompliance >= 80) {
    feedback.push("💪 Excellent protein intake! You're supporting your fitness goals well.");
  } else if (performance.proteinCompliance < 60) {
    feedback.push("🥩 Your protein intake is low. Try adding more lean meats, eggs, or legumes to your meals.");
  }

  // Water feedback
  if (performance.waterCompliance >= 80) {
    feedback.push("💧 Outstanding hydration! You're keeping your body well-hydrated.");
  } else if (performance.waterCompliance >= 60) {
    feedback.push("💦 Good hydration, but you can do better. Try setting reminders throughout the day.");
  } else {
    feedback.push("🚰 Hydration needs attention. Aim to drink water regularly throughout the day.");
  }

  // Streak recognition
  if (performance.longestStreak >= 7) {
    feedback.push(`🔥 Amazing! You maintained a ${performance.longestStreak}-day logging streak!`);
  } else if (performance.longestStreak >= 5) {
    feedback.push(`⭐ Great ${performance.longestStreak}-day streak! Keep it going!`);
  }

  return feedback;
}

/**
 * Generate feedback for monthly summary
 */
function generateMonthlyFeedback(performance, analytics, trends, user) {
  const feedback = [];

  // Overall assessment
  if (performance.consistency >= 80) {
    feedback.push("🎯 Outstanding month! Your consistency and dedication are impressive.");
  } else if (performance.consistency >= 60) {
    feedback.push("👏 Solid month overall. You're building good habits.");
  } else {
    feedback.push("💡 There's room for improvement. Focus on daily consistency next month.");
  }

  // Trend analysis
  if (trends.calories.direction === 'down' && trends.calories.change >= 10) {
    feedback.push(`📉 Calorie intake decreased ${trends.calories.change}% from last month. Great if you're aiming to lose weight!`);
  } else if (trends.calories.direction === 'up' && trends.calories.change >= 10) {
    feedback.push(`📈 Calorie intake increased ${trends.calories.change}% from last month. Monitor portion sizes if this wasn't intentional.`);
  }

  if (trends.protein.direction === 'up' && trends.protein.change >= 10) {
    feedback.push(`💪 Protein intake improved ${trends.protein.change}% from last month. Excellent progress!`);
  } else if (trends.protein.direction === 'down' && trends.protein.change >= 10) {
    feedback.push(`⚠️ Protein intake decreased ${trends.protein.change}% from last month. Try to maintain higher protein levels.`);
  }

  if (trends.water.direction === 'down' && trends.water.change >= 15) {
    feedback.push(`💧 Hydration decreased ${trends.water.change}% from last month. Make hydration a priority!`);
  } else if (trends.water.direction === 'up' && trends.water.change >= 15) {
    feedback.push(`💦 Hydration improved ${trends.water.change}% from last month. Keep it up!`);
  }

  return feedback;
}

/**
 * Identify achievements
 */
function identifyAchievements(trackingData, performance) {
  const achievements = [];

  if (performance.longestStreak >= 7) {
    achievements.push({
      icon: '🔥',
      title: `${performance.longestStreak}-Day Streak`,
      description: `Logged meals ${performance.longestStreak} days in a row!`
    });
  }

  if (performance.consistency >= 85) {
    achievements.push({
      icon: '⭐',
      title: 'Consistency Champion',
      description: `${performance.consistency}% logging rate`
    });
  }

  if (performance.calorieCompliance >= 80) {
    achievements.push({
      icon: '🎯',
      title: 'Calorie Master',
      description: `Met calorie goals ${performance.calorieCompliance}% of the time`
    });
  }

  if (performance.proteinCompliance >= 80) {
    achievements.push({
      icon: '💪',
      title: 'Protein Champion',
      description: `Met protein goals ${performance.proteinCompliance}% of the time`
    });
  }

  if (performance.waterCompliance >= 80) {
    achievements.push({
      icon: '💧',
      title: 'Hydration Hero',
      description: `Met water goals ${performance.waterCompliance}% of the time`
    });
  }

  if (trackingData.length >= 7) {
    achievements.push({
      icon: '📊',
      title: 'Data Collector',
      description: `Logged ${trackingData.length} days of data`
    });
  }

  return achievements;
}

/**
 * Identify monthly achievements
 */
function identifyMonthlyAchievements(trackingData, performance) {
  const achievements = identifyAchievements(trackingData, performance);

  if (trackingData.length >= 25) {
    achievements.push({
      icon: '🏆',
      title: 'Monthly Dedication',
      description: `Logged ${trackingData.length} out of 30 days`
    });
  }

  if (performance.longestStreak >= 14) {
    achievements.push({
      icon: '🔥',
      title: '2-Week Streak Master',
      description: 'Maintained logging for 2+ weeks straight'
    });
  }

  return achievements;
}

/**
 * Generate recommendations
 */
function generateRecommendations(performance, analytics, user) {
  const recommendations = [];

  if (performance.waterCompliance < 70) {
    recommendations.push({
      icon: '💧',
      title: 'Increase Hydration',
      description: `Aim to drink ${(parseFloat(analytics.averages.water) + 0.5).toFixed(1)}L per day`,
      action: 'Enable water reminders'
    });
  }

  if (performance.proteinCompliance < 70) {
    recommendations.push({
      icon: '🥚',
      title: 'Boost Protein Intake',
      description: 'Add one extra protein source to lunch or dinner',
      action: 'Try: eggs, chicken, fish, or legumes'
    });
  }

  if (performance.consistency < 80) {
    recommendations.push({
      icon: '📱',
      title: 'Improve Consistency',
      description: `Aim for ${Math.min(performance.totalDays, performance.daysLogged + 2)}/${performance.totalDays} days next week`,
      action: 'Set daily reminders to log meals'
    });
  }

  if (performance.calorieCompliance < 70) {
    recommendations.push({
      icon: '🎯',
      title: 'Meet Calorie Goals',
      description: 'Focus on portion control and meal planning',
      action: 'Plan meals in advance'
    });
  }

  return recommendations;
}

/**
 * Generate monthly recommendations
 */
function generateMonthlyRecommendations(performance, analytics, trends, user) {
  const recommendations = generateRecommendations(performance, analytics, user);

  if (trends.consistency.direction === 'down') {
    recommendations.push({
      icon: '📈',
      title: 'Rebuild Consistency',
      description: 'Your logging decreased this month. Set a goal to log daily.',
      action: 'Create a daily habit'
    });
  }

  if (performance.longestStreak < 7) {
    recommendations.push({
      icon: '🎯',
      title: 'Build a Streak',
      description: 'Aim for a 7-day logging streak next month',
      action: 'Log immediately after meals'
    });
  }

  return recommendations;
}

module.exports = {
  generateWeeklySummary,
  generateMonthlySummary
};
