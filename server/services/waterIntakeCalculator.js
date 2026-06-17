/**
 * Water Intake Calculator Service
 * Calculates personalized daily water intake recommendations based on user profile
 */

/**
 * Calculate recommended daily water intake in milliliters
 * 
 * Formula based on:
 * - Body weight (primary factor)
 * - Activity level (increases requirement)
 * - Gender (slight variation)
 * - Age (elderly need slightly less)
 * 
 * @param {Object} user - User profile
 * @param {Number} user.weight - Weight in kg
 * @param {String} user.activityLevel - Activity level
 * @param {String} user.gender - Gender
 * @param {Number} user.age - Age in years
 * @returns {Number} Recommended daily water intake in ml
 */
const calculateDailyWaterIntake = (user) => {
  // Default if no weight provided
  if (!user.weight) {
    return 2000; // Default 2 liters
  }

  // Base calculation: 30-35ml per kg of body weight
  let baseIntake = user.weight * 33; // Using 33ml as middle ground

  // Activity level multiplier
  const activityMultipliers = {
    'sedentary': 1.0,      // No additional water needed
    'light': 1.1,          // +10% for light activity
    'moderate': 1.2,       // +20% for moderate activity
    'active': 1.3,         // +30% for active lifestyle
    'very_active': 1.5     // +50% for very active/athletes
  };

  const activityMultiplier = activityMultipliers[user.activityLevel] || 1.2;
  let recommendedIntake = baseIntake * activityMultiplier;

  // Gender adjustment (males typically need slightly more)
  if (user.gender === 'male') {
    recommendedIntake *= 1.05; // +5% for males
  } else if (user.gender === 'female') {
    recommendedIntake *= 0.95; // -5% for females
  }

  // Age adjustment (elderly need slightly less)
  if (user.age && user.age > 65) {
    recommendedIntake *= 0.95; // -5% for elderly
  } else if (user.age && user.age < 18) {
    recommendedIntake *= 0.9; // -10% for children/teens
  }

  // Round to nearest 100ml for cleaner numbers
  recommendedIntake = Math.round(recommendedIntake / 100) * 100;

  // Ensure reasonable bounds (1.5L - 5L)
  recommendedIntake = Math.max(1500, Math.min(5000, recommendedIntake));

  return recommendedIntake;
};

/**
 * Get water intake recommendation with breakdown
 * 
 * @param {Object} user - User profile
 * @returns {Object} Detailed water intake recommendation
 */
const getWaterIntakeRecommendation = (user) => {
  const dailyIntake = calculateDailyWaterIntake(user);
  
  return {
    dailyGoal: dailyIntake,
    dailyGoalLiters: (dailyIntake / 1000).toFixed(1),
    perHour: Math.round(dailyIntake / 16), // Assuming 16 waking hours
    perMeal: Math.round(dailyIntake / 3), // 3 main meals
    glassesPerDay: Math.round(dailyIntake / 250), // 250ml per glass
    breakdown: {
      baseIntake: Math.round(user.weight * 33),
      activityBonus: Math.round((user.weight * 33) * (getActivityMultiplier(user.activityLevel) - 1)),
      totalRecommended: dailyIntake
    },
    tips: getHydrationTips(user)
  };
};

/**
 * Get activity multiplier
 */
const getActivityMultiplier = (activityLevel) => {
  const multipliers = {
    'sedentary': 1.0,
    'light': 1.1,
    'moderate': 1.2,
    'active': 1.3,
    'very_active': 1.5
  };
  return multipliers[activityLevel] || 1.2;
};

/**
 * Get personalized hydration tips
 */
const getHydrationTips = (user) => {
  const tips = [
    'Drink a glass of water when you wake up',
    'Keep a water bottle with you throughout the day',
    'Drink water before, during, and after exercise'
  ];

  if (user.activityLevel === 'active' || user.activityLevel === 'very_active') {
    tips.push('Increase water intake during and after workouts');
    tips.push('Consider electrolyte drinks for intense exercise');
  }

  if (user.age && user.age > 65) {
    tips.push('Set reminders to drink water regularly');
  }

  return tips;
};

/**
 * Calculate hydration status
 * 
 * @param {Number} currentIntake - Current water intake in ml
 * @param {Number} goalIntake - Goal water intake in ml
 * @returns {Object} Hydration status
 */
const getHydrationStatus = (currentIntake, goalIntake) => {
  const percentage = (currentIntake / goalIntake) * 100;
  
  let status, message, color;
  
  if (percentage >= 100) {
    status = 'excellent';
    message = 'Great job! You\'ve met your hydration goal!';
    color = 'green';
  } else if (percentage >= 80) {
    status = 'good';
    message = 'Almost there! Keep drinking water.';
    color = 'blue';
  } else if (percentage >= 50) {
    status = 'moderate';
    message = 'You\'re halfway there. Keep it up!';
    color = 'yellow';
  } else if (percentage >= 25) {
    status = 'low';
    message = 'You need more water. Stay hydrated!';
    color = 'orange';
  } else {
    status = 'critical';
    message = 'Hydration is critical. Drink water now!';
    color = 'red';
  }
  
  return {
    status,
    message,
    color,
    percentage: Math.round(percentage),
    remaining: Math.max(0, goalIntake - currentIntake)
  };
};

module.exports = {
  calculateDailyWaterIntake,
  getWaterIntakeRecommendation,
  getHydrationStatus
};
