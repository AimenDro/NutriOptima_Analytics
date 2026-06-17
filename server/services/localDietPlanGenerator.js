/**
 * Local diet plan generator - works without any AI API
 * Used as fallback when Gemini is unavailable
 */

const pakistaniMeals = {
  breakfast: [
    { item: 'Paratha (whole wheat)', portion: '2 medium', calories: 300, protein: 8, carbs: 42, fats: 12 },
    { item: 'Egg (boiled/fried)', portion: '2 eggs', calories: 140, protein: 12, carbs: 1, fats: 10 },
    { item: 'Chai (milk tea)', portion: '1 cup', calories: 60, protein: 2, carbs: 8, fats: 2 },
    { item: 'Yogurt (dahi)', portion: '1 cup', calories: 100, protein: 8, carbs: 12, fats: 2 },
    { item: 'Banana', portion: '1 medium', calories: 90, protein: 1, carbs: 23, fats: 0 },
  ],
  lunch: [
    { item: 'Chicken Karahi', portion: '200g', calories: 320, protein: 35, carbs: 8, fats: 16 },
    { item: 'Daal (lentils)', portion: '1 cup', calories: 230, protein: 18, carbs: 40, fats: 1 },
    { item: 'Roti (chapati)', portion: '2 pieces', calories: 200, protein: 6, carbs: 40, fats: 2 },
    { item: 'Salad (cucumber, tomato)', portion: '1 bowl', calories: 40, protein: 2, carbs: 8, fats: 0 },
    { item: 'Rice (plain)', portion: '1 cup cooked', calories: 200, protein: 4, carbs: 44, fats: 0 },
  ],
  dinner: [
    { item: 'Beef/Chicken Curry', portion: '200g', calories: 350, protein: 30, carbs: 10, fats: 20 },
    { item: 'Roti (chapati)', portion: '2 pieces', calories: 200, protein: 6, carbs: 40, fats: 2 },
    { item: 'Mixed Vegetables (sabzi)', portion: '1 cup', calories: 120, protein: 4, carbs: 20, fats: 3 },
    { item: 'Yogurt (raita)', portion: '½ cup', calories: 60, protein: 4, carbs: 6, fats: 2 },
  ],
  snack: [
    { item: 'Fruit (apple/banana/orange)', portion: '1 medium', calories: 80, protein: 1, carbs: 20, fats: 0 },
    { item: 'Nuts (almonds/walnuts)', portion: '30g', calories: 180, protein: 6, carbs: 6, fats: 16 },
    { item: 'Yogurt', portion: '1 cup', calories: 100, protein: 8, carbs: 12, fats: 2 },
  ]
};

const internationalMeals = {
  breakfast: [
    { item: 'Oatmeal', portion: '1 cup cooked', calories: 150, protein: 6, carbs: 27, fats: 3 },
    { item: 'Eggs (scrambled)', portion: '2 eggs', calories: 140, protein: 12, carbs: 1, fats: 10 },
    { item: 'Whole wheat toast', portion: '2 slices', calories: 160, protein: 6, carbs: 30, fats: 2 },
    { item: 'Orange juice', portion: '1 glass', calories: 110, protein: 2, carbs: 26, fats: 0 },
    { item: 'Banana', portion: '1 medium', calories: 90, protein: 1, carbs: 23, fats: 0 },
  ],
  lunch: [
    { item: 'Grilled chicken breast', portion: '150g', calories: 250, protein: 47, carbs: 0, fats: 5 },
    { item: 'Brown rice', portion: '1 cup cooked', calories: 215, protein: 5, carbs: 45, fats: 2 },
    { item: 'Steamed broccoli', portion: '1 cup', calories: 55, protein: 4, carbs: 11, fats: 1 },
    { item: 'Olive oil dressing', portion: '1 tbsp', calories: 120, protein: 0, carbs: 0, fats: 14 },
  ],
  dinner: [
    { item: 'Salmon fillet', portion: '150g', calories: 280, protein: 39, carbs: 0, fats: 13 },
    { item: 'Quinoa', portion: '1 cup cooked', calories: 220, protein: 8, carbs: 39, fats: 4 },
    { item: 'Mixed salad', portion: '2 cups', calories: 50, protein: 3, carbs: 10, fats: 0 },
    { item: 'Lemon water', portion: '1 glass', calories: 5, protein: 0, carbs: 1, fats: 0 },
  ],
  snack: [
    { item: 'Apple', portion: '1 medium', calories: 95, protein: 0, carbs: 25, fats: 0 },
    { item: 'Greek yogurt', portion: '150g', calories: 130, protein: 15, carbs: 9, fats: 4 },
    { item: 'Mixed nuts', portion: '30g', calories: 180, protein: 5, carbs: 6, fats: 16 },
  ]
};

function scaleMeals(meals, targetCalories) {
  const totalCals = meals.reduce((sum, f) => sum + f.calories, 0);
  if (!totalCals || totalCals === 0) return meals;
  const factor = targetCalories / totalCals;
  return meals.map(f => ({
    ...f,
    calories: Math.round(f.calories * factor),
    protein: Math.round(f.protein * factor),
    carbs: Math.round(f.carbs * factor),
    fats: Math.round(f.fats * factor),
  }));
}

function buildMeal(name, time, foods) {
  const totals = foods.reduce((acc, f) => ({
    calories: acc.calories + f.calories,
    protein: acc.protein + f.protein,
    carbs: acc.carbs + f.carbs,
    fats: acc.fats + f.fats,
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  return {
    name,
    time,
    foods: foods.map(f => ({
      item: f.item,
      portion: f.portion,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
    })),
    totalCalories: totals.calories,
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFats: totals.fats,
    benefits: 'Balanced meal supporting your nutrition goals'
  };
}

function generateLocalDietPlan(userData) {
  const cuisine = (userData.cuisinePreference || 'international').toLowerCase();
  const db = cuisine === 'pakistani' ? pakistaniMeals : internationalMeals;
  const target = userData.targetCalories || 2000;
  const mealsPerDay = Math.min(6, Math.max(2, parseInt(userData.mealsPerDay) || 3));

  const mealConfigs = {
    2: [
      { name: 'Breakfast', time: '8:00 AM', foods: db.breakfast, pct: 0.4 },
      { name: 'Dinner',    time: '7:00 PM', foods: db.dinner,    pct: 0.6 },
    ],
    3: [
      { name: 'Breakfast', time: '8:00 AM',  foods: db.breakfast, pct: 0.30 },
      { name: 'Lunch',     time: '1:00 PM',  foods: db.lunch,     pct: 0.40 },
      { name: 'Dinner',    time: '7:00 PM',  foods: db.dinner,    pct: 0.30 },
    ],
    4: [
      { name: 'Breakfast', time: '8:00 AM',  foods: db.breakfast, pct: 0.25 },
      { name: 'Lunch',     time: '1:00 PM',  foods: db.lunch,     pct: 0.35 },
      { name: 'Snack',     time: '4:00 PM',  foods: db.snack,     pct: 0.10 },
      { name: 'Dinner',    time: '7:00 PM',  foods: db.dinner,    pct: 0.30 },
    ],
    5: [
      { name: 'Breakfast',         time: '8:00 AM',  foods: db.breakfast, pct: 0.25 },
      { name: 'Mid-Morning Snack', time: '10:30 AM', foods: db.snack,     pct: 0.10 },
      { name: 'Lunch',             time: '1:00 PM',  foods: db.lunch,     pct: 0.30 },
      { name: 'Evening Snack',     time: '4:30 PM',  foods: db.snack,     pct: 0.10 },
      { name: 'Dinner',            time: '7:00 PM',  foods: db.dinner,    pct: 0.25 },
    ],
    6: [
      { name: 'Breakfast',         time: '7:00 AM',  foods: db.breakfast, pct: 0.20 },
      { name: 'Mid-Morning Snack', time: '10:00 AM', foods: db.snack,     pct: 0.10 },
      { name: 'Lunch',             time: '1:00 PM',  foods: db.lunch,     pct: 0.25 },
      { name: 'Afternoon Snack',   time: '3:30 PM',  foods: db.snack,     pct: 0.10 },
      { name: 'Dinner',            time: '6:30 PM',  foods: db.dinner,    pct: 0.25 },
      { name: 'Evening Snack',     time: '9:00 PM',  foods: db.snack,     pct: 0.10 },
    ],
  };

  const config = mealConfigs[mealsPerDay] || mealConfigs[3];
  const meals = config.map(({ name, time, foods, pct }) =>
    buildMeal(name, time, scaleMeals(foods, Math.round(target * pct)))
  );

  const bmi = userData.bmi || 22;
  const bmiCat = userData.bmiCategory || 'Normal weight';

  return {
    success: true,
    plan: {
      healthAssessment: {
        bmiAnalysis: `Your BMI of ${bmi} falls in the '${bmiCat}' category. ${
          bmi < 18.5 ? 'Focus on nutrient-dense foods to reach a healthy weight.' :
          bmi < 25   ? 'You are at a healthy weight. Maintain with balanced nutrition.' :
          bmi < 30   ? 'Aim for gradual weight loss through a calorie deficit.' :
                       'Consult a healthcare provider for a structured weight loss plan.'
        }`,
        keyConsiderations: [
          `Daily calorie target: ${target} kcal`,
          `Protein goal: ${userData.macros?.protein || Math.round(target * 0.25 / 4)}g per day`,
          `Stay hydrated: drink ${userData.waterIntake || 2.5}L of water daily`,
        ],
        recommendations: [
          'Eat at consistent times each day',
          'Include vegetables in every meal',
          'Limit processed foods and added sugars',
        ]
      },
      meals,
      healthTips: [
        { title: 'Stay Hydrated', description: `Drink ${userData.waterIntake || 2.5}L of water daily, especially before meals.` },
        { title: 'Portion Control', description: 'Use smaller plates and eat slowly to avoid overeating.' },
        { title: 'Meal Timing', description: 'Try to eat at the same times each day to regulate metabolism.' },
        { title: 'Sleep Well', description: 'Aim for 7-8 hours of sleep — poor sleep increases hunger hormones.' },
      ],
      foodsToAvoid: [
        { food: 'Sugary drinks', reason: 'High in empty calories with no nutritional value' },
        { food: 'Fried fast food', reason: 'High in unhealthy fats and excess calories' },
        { food: 'White bread/refined carbs', reason: 'Causes blood sugar spikes and crashes' },
      ],
      foodsToPrioritize: [
        { food: 'Lean protein (chicken, fish, eggs)', benefits: 'Builds muscle and keeps you full longer' },
        { food: 'Vegetables and fruits', benefits: 'Rich in vitamins, minerals and fiber' },
        { food: 'Whole grains', benefits: 'Sustained energy and better digestion' },
      ],
      generatedBy: 'local'
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = { generateLocalDietPlan };
