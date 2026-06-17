require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    // Try common model names
    const models = [
      'gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-pro',
      'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite',
      'gemini-2.5-flash', 'gemini-2.5-pro'
    ];

    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "ok" in one word');
        const text = result.response.text();
        console.log(`✅ ${modelName} works: ${text.trim()}`);
        break; // stop at first working one
      } catch (e) {
        console.log(`❌ ${modelName}: ${e.message.split('\n')[0]}`);
      }
    }
  } catch (e) {
    console.error(e.message);
  }
  process.exit(0);
}

listModels();
