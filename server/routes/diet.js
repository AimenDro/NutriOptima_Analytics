const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const DietProfile = require('../models/DietProfile');
const DietPlan = require('../models/DietPlan');
const router = express.Router();

// Path to Python executable and calculator script
const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
const CALORIE_CALCULATOR_PATH = path.join(__dirname, '..', 'calorie_calculator.py');

// Helper function to run calorie calculator
const runCalorieCalculator = (userProfile) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_PATH, [CALORIE_CALCULATOR_PATH, JSON.stringify(userProfile)]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (error) {
          reject(new Error(`Failed to parse calculator output: ${error.message}`));
        }
      } else {
        reject(new Error(`Calculator failed with code ${code}: ${stderr}`));
      }
    });
    
    pythonProcess.on('error', (error) => {
      reject(new Error(`Failed to start calculator process: ${error.message}`));
    });
  });
};

// POST /api/diet/calculate-calories - Calculate BMR, TDEE, and calorie target
router.post('/calculate-calories', async (req, res) => {
  try {
    const userProfile = req.body;

    // Validation
    if (!userProfile.age || !userProfile.gender || !userProfile.weight || !userProfile.height) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'age, gender, weight, and height are required'
        }
      });
    }

    // Run Python calculator
    const result = await runCalorieCalculator(userProfile);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        message: 'Calorie calculations completed successfully'
      });
    } else {
      throw new Error(result.error || 'Calculation failed');
    }

  } catch (error) {
    console.error('Calorie calculation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CALCULATION_ERROR',
        message: error.message || 'Failed to calculate calories'
      }
    });
  }
});

// POST /api/diet/profile - Save or update user's diet profile
router.post('/profile', async (req, res) => {
  try {
    const {
      userId,
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      dietaryRestrictions,
      allergies,
      cuisinePreference,
      mealsPerDay
    } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId is required'
        }
      });
    }

    // Check if profile exists
    let profile = await DietProfile.findOne({ userId });

    if (profile) {
      // Update existing profile
      profile.age = age || profile.age;
      profile.gender = gender || profile.gender;
      profile.weight = weight || profile.weight;
      profile.height = height || profile.height;
      profile.activityLevel = activityLevel || profile.activityLevel;
      profile.goal = goal || profile.goal;
      profile.dietaryRestrictions = dietaryRestrictions || profile.dietaryRestrictions;
      profile.allergies = allergies || profile.allergies;
      profile.cuisinePreference = cuisinePreference || profile.cuisinePreference;
      profile.mealsPerDay = mealsPerDay || profile.mealsPerDay;
      
      await profile.save();
    } else {
      // Create new profile
      profile = new DietProfile({
        userId,
        age,
        gender,
        weight,
        height,
        activityLevel,
        goal,
        dietaryRestrictions,
        allergies,
        cuisinePreference,
        mealsPerDay
      });
      
      await profile.save();
    }

    res.json({
      success: true,
      data: { profile },
      message: 'Diet profile saved successfully'
    });

  } catch (error) {
    console.error('Diet profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to save diet profile'
      }
    });
  }
});

// GET /api/diet/profile/:userId - Get user's diet profile
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const profile = await DietProfile.findOne({ userId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Diet profile not found'
        }
      });
    }

    res.json({
      success: true,
      data: { profile }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get diet profile'
      }
    });
  }
});

// POST /api/diet/generate-plan - Generate diet plan (placeholder for new logic)
router.post('/generate-plan', async (req, res) => {
  try {
    let { userId, userEmail, userProfile } = req.body;

    // Debug log
    console.log('📥 Received request:', { userId, userEmail, hasProfile: !!userProfile });
    console.log('📋 User Profile Data:', JSON.stringify(userProfile, null, 2));

    // Handle guest users - if userId is not a valid ObjectId, set to null
    if (userId && userId !== 'guest' && !userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('⚠️ Invalid userId format, treating as guest');
      userId = null;
      userEmail = userEmail || 'guest@example.com';
    }
    
    // Validation
    if (!userProfile) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userProfile is required'
        }
      });
    }

    // Step 1: Calculate calories using mathematical approach
    console.log('📊 Step 1: Calculating calories...');
    const calorieData = await runCalorieCalculator(userProfile);
    
    if (!calorieData.success) {
      throw new Error('Failed to calculate calories');
    }

    console.log('✅ Calorie calculations complete:', calorieData.data);

    // Step 2: Prepare comprehensive data for Gemini
    const geminiInput = {
      // Calculated values
      targetCalories: calorieData.data.targetCalories,
      bmr: calorieData.data.bmr,
      tdee: calorieData.data.tdee,
      waterIntake: calorieData.data.waterIntake,
      macros: calorieData.data.macros,
      bmi: calorieData.data.bmi,
      bmiCategory: calorieData.data.bmiCategory,
      
      // User information
      age: userProfile.age,
      gender: userProfile.gender,
      weight: userProfile.weight,
      height: userProfile.height,
      activityLevel: userProfile.activityLevel,
      goal: userProfile.goal,
      
      // Health & preferences
      diseases: userProfile.diseases || userProfile.healthConditions || [],
      allergies: userProfile.allergies || [],
      dietaryRestrictions: userProfile.dietaryRestrictions || [],
      cuisinePreference: userProfile.cuisinePreference || 'International',
      mealsPerDay: userProfile.mealsPerDay || 3
    };

    // Step 3: Generate personalized diet plan with Gemini AI (with local fallback)
    console.log('🤖 Step 2: Generating diet plan with Gemini AI...');
    const geminiService = require('../services/geminiService');
    const groqService = require('../services/groqService');
    const { generateLocalDietPlan } = require('../services/localDietPlanGenerator');

    let dietPlan;
    let planSource = 'gemini-ai';

    // Skip Gemini (invalid key), go straight to Groq
    if (groqService.isAvailable()) {
      try {
        dietPlan = await groqService.generatePersonalizedDietPlan(geminiInput);
        planSource = 'groq-ai';
        console.log('✅ Diet plan generated by Groq AI');
      } catch (groqError) {
        console.warn('⚠️ Groq failed, using local generator:', groqError.message);
        dietPlan = generateLocalDietPlan(geminiInput);
        planSource = 'local';
      }
    } else {
      console.warn('⚠️ No AI available, using local generator');
      dietPlan = generateLocalDietPlan(geminiInput);
      planSource = 'local';
    }

    // Step 4: Update User profile with preferences (if user is logged in)
    if (userId && userId !== 'guest') {
      console.log('👤 Updating user profile with preferences...');
      console.log('📝 Raw userProfile data received:', {
        diseases: userProfile.diseases,
        allergies: userProfile.allergies,
        dietaryRestrictions: userProfile.dietaryRestrictions,
        goal: userProfile.goal,
        cuisinePreference: userProfile.cuisinePreference,
        mealsPerDay: userProfile.mealsPerDay
      });
      
      // Prepare data for update
      const updateData = {
        allergies: Array.isArray(userProfile.allergies) && userProfile.allergies.length > 0 
          ? userProfile.allergies 
          : [],
        dietaryPreferences: Array.isArray(userProfile.dietaryRestrictions) && userProfile.dietaryRestrictions.length > 0 
          ? userProfile.dietaryRestrictions 
          : [],
        healthGoals: userProfile.goal ? [userProfile.goal] : [],
        cuisinePreference: userProfile.cuisinePreference || 'international',
        healthConditions: Array.isArray(userProfile.diseases) && userProfile.diseases.length > 0 
          ? userProfile.diseases 
          : ['none'],
        mealsPerDay: userProfile.mealsPerDay || 3,
        // Update physical attributes if provided
        age: userProfile.age,
        gender: userProfile.gender,
        weight: userProfile.weight,
        height: userProfile.height,
        activityLevel: userProfile.activityLevel
      };
      
      console.log('📝 Data prepared for database update:', updateData);
      
      try {
        const User = require('../models/User');
        const updateResult = await User.findByIdAndUpdate(userId, {
          $set: updateData
        }, { new: true });
        
        console.log('✅ User profile updated successfully');
        console.log('✅ Saved to database:', {
          allergies: updateResult.allergies,
          dietaryPreferences: updateResult.dietaryPreferences,
          healthGoals: updateResult.healthGoals,
          healthConditions: updateResult.healthConditions,
          cuisinePreference: updateResult.cuisinePreference,
          mealsPerDay: updateResult.mealsPerDay
        });
      } catch (updateError) {
        console.error('⚠️ Failed to update user profile:', updateError.message);
        console.error('⚠️ Error details:', updateError);
        // Continue even if update fails
      }
    }

    // Step 5: Save diet plan to database
    console.log('💾 Saving diet plan to database with:', { 
      userId, 
      userEmail, 
      hasTargets: !!calorieData.data.targetCalories 
    });
    
    const planData = {
      planType: 'daily',
      source: planSource,
      targets: {
        calories: calorieData.data.targetCalories,
        protein: calorieData.data.macros.protein,
        carbs: calorieData.data.macros.carbs,
        fat: calorieData.data.macros.fat
      },
      nlpAdvice: {
        calculations: calorieData.data,
        aiPlan: dietPlan,
        userProfile: geminiInput
      }
    };
    
    // Only add userId and userEmail if they exist
    if (userId) planData.userId = userId;
    if (userEmail) planData.userEmail = userEmail;

    // Auto-number the plan for this user
    const existingCount = await DietPlan.countDocuments(
      userId ? { userId } : { userEmail }
    );
    planData.planNumber = existingCount + 1;
    planData.planName = `Diet Plan #${existingCount + 1} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const plan = new DietPlan(planData);
    
    await plan.save();
    console.log('✅ Diet plan saved to database');

    // Step 6: Return comprehensive response
    res.json({
      success: true,
      data: {
        calculations: calorieData.data,
        dietPlan: dietPlan,
        savedPlanId: plan._id
      },
      message: 'Personalized diet plan generated successfully. Visit your dashboard to start tracking!'
    });

  } catch (error) {
    console.error('Generate plan error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to generate diet plan'
      }
    });
  }
});

// GET /api/diet/plans/:userId - Get user's diet plans
router.get('/plans/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const plans = await DietPlan.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { plans }
    });

  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to get diet plans'
      }
    });
  }
});

// POST /api/diet/save-plan - Save a diet plan
router.post('/save-plan', async (req, res) => {
  try {
    const { userId, planData } = req.body;

    if (!userId || !planData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userId and planData are required'
        }
      });
    }

    const dietPlan = new DietPlan({
      userId,
      ...planData
    });

    await dietPlan.save();

    res.json({
      success: true,
      data: { plan: dietPlan },
      message: 'Diet plan saved successfully'
    });

  } catch (error) {
    console.error('Save plan error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to save diet plan'
      }
    });
  }
});

module.exports = router;
