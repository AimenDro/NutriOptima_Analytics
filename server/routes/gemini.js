const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const FoodRecognition = require('../models/FoodRecognition');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'server/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `food-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/gemini/analyze-food-vision - Analyze food with Vision AI and save to DB
router.post('/analyze-food-vision', upload.single('image'), async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured. Please add GEMINI_API_KEY to environment variables.'
        }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Image file is required'
        }
      });
    }

    const imagePath = req.file.path;
    const userId = req.body.userId;
    const userEmail = req.body.userEmail;

    // Analyze food with Gemini Vision
    const analysisResult = await geminiService.analyzeFoodImageWithVision(imagePath);

    // Prepare data for database
    const foodData = {
      userId: userId || null,
      userEmail: userEmail || null,
      predictions: analysisResult.data.items?.map((item, index) => ({
        rank: index + 1,
        fruit: item.name || item.food_item || 'Unknown',
        confidence: item.confidence || 0.95,
        percentage: (item.confidence || 0.95) * 100,
        weight_grams: item.weight_grams || item.estimated_weight
      })) || [],
      topPrediction: analysisResult.data.items?.[0] ? {
        rank: 1,
        fruit: analysisResult.data.items[0].name || analysisResult.data.items[0].food_item || 'Unknown',
        confidence: analysisResult.data.items[0].confidence || 0.95,
        percentage: (analysisResult.data.items[0].confidence || 0.95) * 100
      } : null,
      nutrition: {
        calories: analysisResult.data.nutrients?.calories || 0,
        carbs: analysisResult.data.nutrients?.carbs || 0,
        protein: analysisResult.data.nutrients?.protein || 0,
        fat: analysisResult.data.nutrients?.fats || 0,
        fiber: analysisResult.data.nutrients?.fiber || 0,
        sugar: analysisResult.data.nutrients?.sugar || 0
      },
      micronutrients: analysisResult.data.micronutrients || {},
      deficiencyRisk: analysisResult.data.deficiency_risk || null,
      healthScore: analysisResult.data.health_score || null,
      recommendations: analysisResult.data.recommendations || [],
      modelType: 'Gemini Vision 1.5 Flash',
      dataset: 'Gemini AI',
      imageMetadata: {
        size: req.file.size,
        format: req.file.mimetype,
        uploadedAt: new Date(),
        path: imagePath
      }
    };

    // Save to database
    const foodRecognition = new FoodRecognition(foodData);
    await foodRecognition.save();

    // Return user-friendly response with structured data
    res.json({
      success: true,
      data: {
        id: foodRecognition._id,
        foodItems: analysisResult.data.items || [],
        nutrition: {
          ...foodData.nutrition,
          micronutrients: analysisResult.data.micronutrients
        },
        healthScore: analysisResult.data.health_score,
        deficiencyRisk: analysisResult.data.deficiency_risk,
        recommendations: analysisResult.data.recommendations,
        // Display format (user-friendly)
        displaySummary: {
          mainFood: foodData.topPrediction?.fruit || 'Unknown Food',
          totalCalories: foodData.nutrition.calories,
          macros: {
            protein: `${foodData.nutrition.protein}g`,
            carbs: `${foodData.nutrition.carbs}g`,
            fats: `${foodData.nutrition.fat}g`,
            fiber: `${foodData.nutrition.fiber}g`
          }
        },
        timestamp: analysisResult.timestamp
      },
      message: 'Food analyzed and saved successfully'
    });

  } catch (error) {
    console.error('Food vision analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze food image'
      }
    });
  }
});

// POST /api/gemini/nutrition-advice - Get personalized nutrition advice
router.post('/nutrition-advice', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured. Please add GEMINI_API_KEY to environment variables.'
        }
      });
    }

    const userProfile = req.body;

    // Validate required fields
    if (!userProfile.age || !userProfile.gender || !userProfile.weight || !userProfile.height) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: age, gender, weight, height'
        }
      });
    }

    const result = await geminiService.generateNutritionAdvice(userProfile);

    res.json({
      success: true,
      data: result,
      message: 'Nutrition advice generated successfully'
    });

  } catch (error) {
    console.error('Nutrition advice error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate nutrition advice'
      }
    });
  }
});

// POST /api/gemini/analyze-food - Analyze food with AI
router.post('/analyze-food', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured'
        }
      });
    }

    const { imageBase64, detectedFood } = req.body;

    if (!detectedFood) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'detectedFood is required'
        }
      });
    }

    const result = await geminiService.analyzeFoodImage(imageBase64, detectedFood);

    res.json({
      success: true,
      data: result,
      message: 'Food analyzed successfully'
    });

  } catch (error) {
    console.error('Food analysis error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: error.message || 'Failed to analyze food'
      }
    });
  }
});

// POST /api/gemini/meal-suggestions - Get meal plan suggestions
router.post('/meal-suggestions', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured'
        }
      });
    }

    const { userProfile, currentPlan } = req.body;

    if (!userProfile || !currentPlan) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'userProfile and currentPlan are required'
        }
      });
    }

    const result = await geminiService.generateMealPlanSuggestions(userProfile, currentPlan);

    res.json({
      success: true,
      data: result,
      message: 'Meal suggestions generated successfully'
    });

  } catch (error) {
    console.error('Meal suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate meal suggestions'
      }
    });
  }
});

// POST /api/gemini/ask - Ask nutrition question
router.post('/ask', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured'
        }
      });
    }

    const { question, userContext } = req.body;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'question is required'
        }
      });
    }

    const result = await geminiService.answerNutritionQuestion(question, userContext || {});

    res.json({
      success: true,
      data: result,
      message: 'Question answered successfully'
    });

  } catch (error) {
    console.error('Question answering error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANSWER_ERROR',
        message: error.message || 'Failed to answer question'
      }
    });
  }
});

// POST /api/gemini/generate-recipe - Generate recipe from ingredients
router.post('/generate-recipe', async (req, res) => {
  try {
    if (!geminiService.isAvailable()) {
      return res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Gemini AI service is not configured'
        }
      });
    }

    const { ingredients, userPreferences } = req.body;

    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'ingredients array is required and must not be empty'
        }
      });
    }

    const result = await geminiService.generateRecipe(ingredients, userPreferences || {});

    res.json({
      success: true,
      data: result,
      message: 'Recipe generated successfully'
    });

  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: error.message || 'Failed to generate recipe'
      }
    });
  }
});

// GET /api/gemini/status - Check Gemini service status
router.get('/status', (req, res) => {
  const isAvailable = geminiService.isAvailable();
  
  res.json({
    success: true,
    data: {
      available: isAvailable,
      status: isAvailable ? 'active' : 'not_configured',
      message: isAvailable 
        ? 'Gemini AI is ready to use' 
        : 'Gemini API key not configured. Add GEMINI_API_KEY to .env file',
      features: [
        'Personalized nutrition advice',
        'Food image analysis',
        'Meal plan suggestions',
        'Nutrition Q&A',
        'Recipe generation'
      ]
    }
  });
});

module.exports = router;
