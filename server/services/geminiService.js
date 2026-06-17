const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = null;
    this.visionModel = null;
    this.modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.visionModel = this.genAI.getGenerativeModel({ model: this.modelNames[0] });
      console.log('✅ Gemini AI initialized successfully (Text + Vision)');
    } else {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables');
    }
  }

  // Try each model in order until one works
  async generateWithFallback(prompt) {
    // Always use fresh key from env (handles key rotation without restart)
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    for (const modelName of this.modelNames) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { maxOutputTokens: 8192 }
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (e) {
        const status = e.status || 0;
        if (status === 503 || status === 429) {
          console.warn(`⚠️ ${modelName} unavailable (${status}), trying next model...`);
          continue;
        }
        throw e;
      }
    }
    throw new Error('All Gemini models are currently unavailable. Please try again in a few minutes.');
  }

  /**
   * Get nutrition information for a food item by name
   */
  async getNutritionByFoodName(foodName, quantity = '100g') {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized');
    }

    const prompt = `You are a nutrition expert. Provide detailed nutrition information for: "${foodName}" (${quantity}).

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "foodName": "standardized food name",
  "quantity": "${quantity}",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fats": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": "high/medium/low"
}

Be accurate and use standard nutrition databases. If uncertain, use "confidence": "low".`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Clean up response
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const nutritionData = JSON.parse(text);
      
      return {
        success: true,
        data: nutritionData
      };
    } catch (error) {
      console.error('Gemini nutrition lookup error:', error);
      throw new Error(`Failed to get nutrition info: ${error.message}`);
    }
  }

  /**
   * Generate personalized diet plan based on calculated calories and user data
   */
  async generatePersonalizedDietPlan(userData) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized. Please add GEMINI_API_KEY to .env file');
    }

    // Determine meal structure based on mealsPerDay
    const mealStructures = {
      2: ['Breakfast', 'Dinner'],
      3: ['Breakfast', 'Lunch', 'Dinner'],
      4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
      5: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
      6: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack']
    };

    const mealsToGenerate = mealStructures[userData.mealsPerDay] || mealStructures[3];
    const mealsList = mealsToGenerate.join(', ');

    const prompt = `You are an expert nutritionist and diet planner. Create a comprehensive, personalized diet plan based on the following information:

CALCULATED NUTRITIONAL NEEDS:
- Target Daily Calories: ${userData.targetCalories} kcal
- BMR: ${userData.bmr} kcal | TDEE: ${userData.tdee} kcal
- BMI: ${userData.bmi} (${userData.bmiCategory})
- Daily Water: ${userData.waterIntake}L
- Macros: Protein ${userData.macros.protein}g | Carbs ${userData.macros.carbs}g | Fats ${userData.macros.fat}g

USER PROFILE:
Age: ${userData.age} | Gender: ${userData.gender} | Weight: ${userData.weight}kg | Height: ${userData.height}cm
Activity: ${userData.activityLevel} | Goal: ${userData.goal}
Diseases: ${(userData.diseases||[]).length > 0 ? (userData.diseases||[]).join(', ') : 'None'}
Allergies: ${(userData.allergies||[]).length > 0 ? (userData.allergies||[]).join(', ') : 'None'}
Restrictions: ${(userData.dietaryRestrictions||[]).length > 0 ? (userData.dietaryRestrictions||[]).join(', ') : 'None'}
Cuisine: ${userData.cuisinePreference} | Meals: ${userData.mealsPerDay}/day

IMPORTANT MEAL STRUCTURE:
- User wants EXACTLY ${userData.mealsPerDay} meals per day
- Generate these specific meals: ${mealsList}
- Distribute ${userData.targetCalories} calories across these ${userData.mealsPerDay} meals
- Each meal should be substantial and balanced
- DO NOT add extra meals or snacks beyond what's specified

MEAL DISTRIBUTION GUIDELINES:
${userData.mealsPerDay === 2 ? '- Breakfast: 40% of calories (~' + Math.round(userData.targetCalories * 0.4) + ' kcal)\n- Dinner: 60% of calories (~' + Math.round(userData.targetCalories * 0.6) + ' kcal)' : ''}
${userData.mealsPerDay === 3 ? '- Breakfast: 30% of calories (~' + Math.round(userData.targetCalories * 0.3) + ' kcal)\n- Lunch: 40% of calories (~' + Math.round(userData.targetCalories * 0.4) + ' kcal)\n- Dinner: 30% of calories (~' + Math.round(userData.targetCalories * 0.3) + ' kcal)' : ''}
${userData.mealsPerDay === 4 ? '- Breakfast: 25% (~' + Math.round(userData.targetCalories * 0.25) + ' kcal)\n- Lunch: 35% (~' + Math.round(userData.targetCalories * 0.35) + ' kcal)\n- Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)\n- Dinner: 30% (~' + Math.round(userData.targetCalories * 0.3) + ' kcal)' : ''}
${userData.mealsPerDay === 5 ? '- Breakfast: 25% (~' + Math.round(userData.targetCalories * 0.25) + ' kcal)\n- Mid-Morning Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)\n- Lunch: 30% (~' + Math.round(userData.targetCalories * 0.3) + ' kcal)\n- Evening Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)\n- Dinner: 25% (~' + Math.round(userData.targetCalories * 0.25) + ' kcal)' : ''}
${userData.mealsPerDay === 6 ? '- Breakfast: 20% (~' + Math.round(userData.targetCalories * 0.2) + ' kcal)\n- Mid-Morning Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)\n- Lunch: 30% (~' + Math.round(userData.targetCalories * 0.3) + ' kcal)\n- Afternoon Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)\n- Dinner: 20% (~' + Math.round(userData.targetCalories * 0.2) + ' kcal)\n- Evening Snack: 10% (~' + Math.round(userData.targetCalories * 0.1) + ' kcal)' : ''}

Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "healthAssessment": {
    "bmiAnalysis": "2-3 sentences about their BMI status",
    "keyConsiderations": ["consideration 1", "consideration 2", "consideration 3"],
    "recommendations": ["recommendation 1", "recommendation 2"]
  },
  "meals": [
    {
      "name": "Breakfast",
      "time": "7:00 AM - 8:00 AM",
      "foods": [
        {"item": "Food name", "portion": "Amount", "calories": 200, "protein": 10, "carbs": 30, "fats": 5}
      ],
      "totalCalories": 400,
      "totalProtein": 20,
      "totalCarbs": 50,
      "totalFats": 10,
      "benefits": "Why this meal helps their goal"
    }
  ],
  "healthTips": [
    {"title": "Tip title", "description": "Practical advice"},
    {"title": "Tip title", "description": "Practical advice"}
  ],
  "foodsToAvoid": [
    {"food": "Food name", "reason": "Why to avoid it"}
  ],
  "foodsToPrioritize": [
    {"food": "Food name", "benefits": "Why it's good"}
  ]
}

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${userData.mealsPerDay} meals as specified: ${mealsList}
2. Total calories across all meals must equal ${userData.targetCalories} kcal
3. Follow the calorie distribution guidelines provided above
4. Each meal must include specific foods with portions and macros
5. Make it practical for ${userData.cuisinePreference} cuisine
6. Respect all dietary restrictions and allergies
7. Consider health conditions when selecting foods

DO NOT add extra meals, snacks, or sections beyond the ${userData.mealsPerDay} meals specified.`;

    try {
      let text = await this.generateWithFallback(prompt);

      // Clean up the response - remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to parse as JSON
      let planData;
      try {
        planData = JSON.parse(text);
      } catch (parseError) {
        // If JSON parsing fails, return as plain text
        console.warn('Failed to parse JSON, returning as text:', parseError.message);
        planData = { plainText: text };
      }
      
      return {
        success: true,
        plan: planData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate diet plan: ${error.message}`);
    }
  }

  /**
   * Generate nutrition advice based on user profile
   */
  async generateNutritionAdvice(userProfile) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized. Please add GEMINI_API_KEY to .env file');
    }

    const prompt = `
You are a professional nutritionist. Based on the following user profile, provide personalized nutrition advice:

User Profile:
- Age: ${userProfile.age} years
- Gender: ${userProfile.gender}
- Weight: ${userProfile.weight} kg
- Height: ${userProfile.height} cm
- Activity Level: ${userProfile.activityLevel}
- Goal: ${userProfile.goal}
- Health Conditions: ${userProfile.healthConditions?.join(', ') || 'None'}
- Dietary Restrictions: ${userProfile.dietaryRestrictions?.join(', ') || 'None'}
- Cuisine Preference: ${userProfile.cuisinePreference || 'International'}

Please provide:
1. Daily calorie recommendation
2. Macronutrient breakdown (protein, carbs, fats)
3. 3 specific food recommendations
4. 2 foods to avoid
5. One motivational tip

Keep the response concise and actionable.
`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        advice: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate advice: ${error.message}`);
    }
  }

  /**
   * Analyze food image with vision model and return structured JSON
   * This is the "Secret Sauce" for professional nutritional analysis
   */
  async analyzeFoodImageWithVision(imagePath) {
    if (!this.visionModel) {
      throw new Error('Gemini Vision API not initialized');
    }

    try {
      // Read image file
      const imageData = await fs.readFile(imagePath);
      const imageBase64 = imageData.toString('base64');

      // Professional prompt for structured JSON response
      const prompt = `You are an expert food recognition and nutrition AI. Analyze this image carefully.

First determine: does this image contain food or drink?
If NOT food/drink, return ONLY: {"isNonFood": true, "error": "Please upload a food or drink image only."}

If it IS food/drink, identify EXACTLY what food it is (be specific - e.g. "club sandwich" not just "sandwich", "grilled chicken breast" not just "chicken", "cheese pizza slice" not just "pizza").

Return ONLY valid JSON (no markdown):
{
  "isNonFood": false,
  "items": [
    {"name": "specific food name", "weight_g": 150}
  ],
  "nutrients": {
    "calories": 320,
    "protein": 18,
    "carbs": 35,
    "fats": 12,
    "fiber": 3,
    "sugar": 5
  },
  "micronutrients": {
    "iron_mg": 2.1,
    "vitamin_d_mcg": 0.5,
    "vitamin_b12_mcg": 0.8,
    "calcium_mg": 85,
    "vitamin_c_mg": 12
  },
  "deficiency_risk": "brief note if meal lacks a common nutrient",
  "health_score": 7,
  "recommendations": ["suggestion 1", "suggestion 2"]
}

Be specific with food names. Estimate realistic portion sizes visually. Provide accurate nutrition values.`;

      const imagePart = {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg'
        }
      };

      const result = await this.visionModel.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text();

      // Clean up response - remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Parse JSON response
      const nutritionData = JSON.parse(text);

      return {
        success: true,
        data: nutritionData,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini Vision API Error:', error);
      throw new Error(`Failed to analyze food image: ${error.message}`);
    }
  }

  /**
   * Analyze food image and provide detailed nutrition info (legacy method)
   */
  async analyzeFoodImage(imageBase64, detectedFood) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized');
    }

    const prompt = `
You are a nutrition expert. The food detected in the image is: ${detectedFood}

Please provide:
1. Confirm if this is ${detectedFood} or suggest what it might be
2. Detailed nutritional information per 100g (calories, protein, carbs, fat, fiber)
3. Health benefits (2-3 points)
4. Best time to eat this food
5. Serving size recommendation

Keep it concise and practical.
`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        analysis: text,
        detectedFood,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to analyze food: ${error.message}`);
    }
  }

  /**
   * Generate meal plan suggestions
   */
  async generateMealPlanSuggestions(userProfile, currentPlan) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized');
    }

    const prompt = `
You are a meal planning expert. Based on this user profile and their current meal plan, suggest improvements:

User Profile:
- Age: ${userProfile.age}, Gender: ${userProfile.gender}
- Weight: ${userProfile.weight}kg, Height: ${userProfile.height}cm
- Goal: ${userProfile.goal}
- Cuisine: ${userProfile.cuisinePreference}

Current Meal Plan:
${JSON.stringify(currentPlan, null, 2)}

Please provide:
1. Overall assessment of the meal plan
2. 3 specific improvements
3. Alternative food suggestions
4. Timing recommendations

Keep it practical and actionable.
`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        suggestions: text,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate suggestions: ${error.message}`);
    }
  }

  /**
   * Answer nutrition-related questions
   */
  async answerNutritionQuestion(question, userContext = {}) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized');
    }

    const contextInfo = userContext.age ? `
User Context:
- Age: ${userContext.age}
- Goal: ${userContext.goal || 'General health'}
- Dietary Restrictions: ${userContext.dietaryRestrictions?.join(', ') || 'None'}
` : '';

    const prompt = `
You are a professional nutritionist. Answer this question:

${question}

${contextInfo}

Provide a clear, evidence-based answer. Keep it concise (3-4 sentences) and actionable.
`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        answer: text,
        question,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * Generate personalized recipe based on available ingredients
   */
  async generateRecipe(ingredients, userPreferences = {}) {
    if (!this.visionModel) {
      throw new Error('Gemini API not initialized');
    }

    const prompt = `
Create a healthy recipe using these ingredients: ${ingredients.join(', ')}

User Preferences:
- Cuisine: ${userPreferences.cuisine || 'Any'}
- Dietary Restrictions: ${userPreferences.restrictions?.join(', ') || 'None'}
- Cooking Time: ${userPreferences.cookingTime || 'Any'}
- Difficulty: ${userPreferences.difficulty || 'Any'}

Please provide:
1. Recipe name
2. Ingredients with quantities
3. Step-by-step instructions (numbered)
4. Cooking time
5. Nutritional information (approximate)
6. Serving size

Format it clearly and make it easy to follow.
`;

    try {
      const result = await this.visionModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        recipe: text,
        ingredients,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
  }

  /**
   * Check if Gemini is available
   */
  isAvailable() {
    return this.visionModel !== null;
  }
}

// Create singleton instance
const geminiService = new GeminiService();

module.exports = geminiService;
