import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a world-class sports science content curator and advanced coach for Trainlog.
Your task is to analyze the user's recent training journal entries and produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles (one for each category: recovery, training, mindset, nutrition) that are deeply tied to the user's specific situation. 
Content Rules:
1. Generate exactly 4 articles, one for each category: recovery, training, mindset, nutrition.
2. You MUST write ALL generated content strictly in Spanish.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "mindset" | "nutrition",
      "content": "string",
      "reason": "string",
      "recommendedExercises": [{"englishName": "string"}]
    }
  ]
}`;

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: '{"entries": [{"id": "1", "transcript": "Hoy hice pecho y triceps, me siento cansado."}]}' }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });
    
    const parsed = JSON.parse(chatCompletion.choices[0]?.message?.content);
    console.log("Articles generated:", parsed.articles?.length);
  } catch (error) {
    console.error("API Error:", error);
  }
}

run();
