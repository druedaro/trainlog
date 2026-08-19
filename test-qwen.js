import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: 'Output exactly {"test": true}' }, { role: 'user', content: 'test' }],
      model: 'qwen/qwen3.6-27b',
      response_format: { type: 'json_object' }
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("API Error:", error.message);
  }
}

run();
