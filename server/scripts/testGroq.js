require('dotenv').config();
const Groq = require('groq-sdk');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function test() {
  try {
    const result = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Respond with ONLY valid JSON.' },
        { role: 'user', content: 'Return JSON with key test and value working' }
      ],
      max_tokens: 50,
      response_format: { type: 'json_object' }
    });
    console.log('✅ Groq response_format test:', result.choices[0].message.content);
  } catch (e) {
    console.log('❌ response_format error:', e.message);
    // Try without response_format
    try {
      const result2 = await client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Respond with ONLY valid JSON.' },
          { role: 'user', content: 'Return JSON with key test and value working' }
        ],
        max_tokens: 50
      });
      console.log('✅ Groq without response_format:', result2.choices[0].message.content);
    } catch (e2) {
      console.log('❌ Both failed:', e2.message);
    }
  }
}

test();
