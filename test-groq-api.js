import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: "Generate some JSON. Respond ONLY with a valid JSON array of objects." },
        { role: 'user', content: "{}" }
      ],
      model: 'qwen/qwen3.6-27b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("API Error:", error);
  }
}

run();
