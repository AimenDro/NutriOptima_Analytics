const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Test 1: Python calorie calculator
  console.log('=== TEST 1: Python Calorie Calculator ===');
  const { spawn } = require('child_process');
  const path = require('path');
  const PYTHON_PATH = process.env.PYTHON_PATH || 'python';
  const CALC_PATH = path.join(__dirname, '..', 'calorie_calculator.py');

  const profile = { age: 25, gender: 'female', weight: 60, height: 165, activityLevel: 'moderately_active', goal: 'maintain', diseases: [], allergies: [], cuisinePreference: 'pakistani', mealsPerDay: 3 };

  const proc = spawn(PYTHON_PATH, [CALC_PATH, JSON.stringify(profile)]);
  let out = '', err = '';
  proc.stdout.on('data', d => out += d);
  proc.stderr.on('data', d => err += d);
  proc.on('close', async (code) => {
    console.log('Exit code:', code);
    console.log('stdout:', out);
    if (err) console.log('stderr:', err);

    if (code !== 0) {
      console.log('❌ Python calculator failed');
      process.exit(1);
    }

    // Test 2: Gemini AI
    console.log('\n=== TEST 2: Gemini AI ===');
    const geminiService = require('../services/geminiService');
    console.log('Gemini available:', geminiService.isAvailable());

    if (!geminiService.isAvailable()) {
      console.log('❌ Gemini not available - check GEMINI_API_KEY in .env');
      process.exit(1);
    }

    try {
      const calc = JSON.parse(out);
      const input = { ...calc.data, ...profile };
      console.log('Calling Gemini...');
      const plan = await geminiService.generatePersonalizedDietPlan(input);
      console.log('✅ Gemini response received');
      console.log('Plan keys:', Object.keys(plan || {}));
    } catch (e) {
      console.log('❌ Gemini error:', e.message);
    }
    process.exit(0);
  });
}).catch(e => { console.error(e.message); process.exit(1); });
