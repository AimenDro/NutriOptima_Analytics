const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    this.client = null;

    if (this.apiKey) {
      this.client = new Groq({ apiKey: this.apiKey });
      console.log('✅ Groq AI initialized successfully');
    } else {
      console.warn('⚠️ GROQ_API_KEY not found in environment variables');
    }
  }

  async analyzeFoodImage(imagePath) {
    if (!this.client) throw new Error('Groq not initialized');
    const fs = require('fs');
    const path = require('path');
    const imageData = fs.readFileSync(imagePath);
    const base64 = imageData.toString('base64');
    const ext = path.extname(imagePath).toLowerCase().replace('.', '');
    const mimeMap = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', jfif: 'image/jpeg' };
    const mimeType = mimeMap[ext] || 'image/jpeg';

    const completion = await this.client.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'First determine if this image contains food or a drink. If it does NOT contain food or drink, return ONLY this exact JSON: {"isNonFood":true,"error":"Please upload a food or drink image only."}. If it DOES contain food or drink, return ONLY valid JSON with no extra text: {"isNonFood":false,"foodName":"exact food name","calories":0,"protein":0,"carbs":0,"fat":0,"fiber":0,"confidence":0.9}'
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType};base64,${base64}` }
          }
        ]
      }],
      max_tokens: 200,
      temperature: 0.1
    });

    let text = completion.choices[0].message.content.trim();
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  }

  async generatePersonalizedDietPlan(userData) {
    if (!this.client) {
      throw new Error('Groq API not initialized. Please add GROQ_API_KEY to .env file');
    }

    const mealStructures = {
      2: ['Breakfast', 'Dinner'],
      3: ['Breakfast', 'Lunch', 'Dinner'],
      4: ['Breakfast', 'Lunch', 'Snack', 'Dinner'],
      5: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
      6: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack']
    };

    const mealsToGenerate = mealStructures[userData.mealsPerDay] || mealStructures[3];
    const mealsList = mealsToGenerate.join(', ');

    const prompt = `Create a personalized diet plan. Return ONLY valid JSON, no extra text.

USER: Age ${userData.age}, ${userData.gender}, ${userData.weight}kg, ${userData.height}cm, ${userData.activityLevel}, Goal: ${userData.goal}
NUTRITION: ${userData.targetCalories} kcal, Protein ${userData.macros.protein}g, Carbs ${userData.macros.carbs}g, Fat ${userData.macros.fat}g, Water ${userData.waterIntake}L
BMI: ${userData.bmi} (${userData.bmiCategory})
Diseases: ${(userData.diseases||[]).join(', ')||'None'} | Allergies: ${(userData.allergies||[]).join(', ')||'None'}
Cuisine: ${userData.cuisinePreference} | Meals: ${userData.mealsPerDay}/day (${mealsList})

JSON structure required:
{"healthAssessment":{"bmiAnalysis":"string","keyConsiderations":["..."],"recommendations":["..."]},"meals":[{"name":"Breakfast","time":"8:00 AM","foods":[{"item":"string","portion":"string","calories":0,"protein":0,"carbs":0,"fats":0}],"totalCalories":0,"totalProtein":0,"totalCarbs":0,"totalFats":0,"benefits":"string"}],"healthTips":[{"title":"string","description":"string"}],"foodsToAvoid":[{"food":"string","reason":"string"}],"foodsToPrioritize":[{"food":"string","benefits":"string"}]}`;

    const completion = await this.client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are a nutrition expert. Respond with ONLY a valid JSON object. Use double quotes. No markdown, no code blocks, no extra text before or after the JSON.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: 8000,
      temperature: 0.3
    });

    let text = completion.choices[0].message.content.trim();

    // Remove markdown code blocks if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];

    let planData;
    try {
      planData = JSON.parse(text);
      // Handle double-encoded string
      while (typeof planData === 'string') {
        planData = JSON.parse(planData);
      }
      // Handle single-key wrapper like { "diet_plan": {...} }
      const keys = Object.keys(planData);
      if (keys.length === 1 && !planData.meals && !planData.healthAssessment) {
        const inner = planData[keys[0]];
        if (typeof inner === 'string') {
          planData = JSON.parse(inner);
        } else if (typeof inner === 'object') {
          planData = inner;
        }
      }
    } catch (e) {
      console.warn('Groq parse failed:', e.message);
      planData = { plainText: text };
    }

    // Final validation — if still no meals, log warning
    if (!planData.meals && !planData.healthAssessment) {
      console.warn('⚠️ Groq response missing meals/healthAssessment, keys:', Object.keys(planData));
    } else {
      console.log('✅ Groq plan parsed successfully, meals:', planData.meals?.length);
    }

    return {
      success: true,
      plan: planData,
      timestamp: new Date().toISOString()
    };
  }

  isAvailable() {
    return this.client !== null;
  }
}

const groqService = new GroqService();
module.exports = groqService;
