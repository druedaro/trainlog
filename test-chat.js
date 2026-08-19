import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a coach. Respond ONLY in valid JSON.
{
  "message": "string"
}`;

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'hola' }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("API Error:", error);
  }
}

run();
