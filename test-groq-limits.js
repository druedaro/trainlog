import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function test(model) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hi' }],
      model: model,
    });
    console.log(model, "Rate limits:", chatCompletion.response.headers);
  } catch (error) {
    console.log(model, "FAILED:", error.message);
  }
}

test('openai/gpt-oss-120b');
