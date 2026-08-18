import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function test(model) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Generate a short JSON object with {"status": "ok"}' }],
      model: model,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    console.log(model, "JSON Mode Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.log(model, "JSON Mode FAILED:", error.message);
  }
}

test('groq/compound');
test('qwen/qwen3.6-27b');
test('openai/gpt-oss-120b');
test('openai/gpt-oss-20b');
