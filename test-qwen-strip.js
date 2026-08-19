import Groq from 'groq-sdk';
import fs from 'fs';
import { z } from 'zod';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a world-class sports science content curator for Trainlog.
Your task is to produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles.

CRITICAL: These are NOT personalized to a specific user. They are general exploration articles.

Respond ONLY with a valid raw JSON object matching this exact structure, do NOT add any markdown formatting like \`\`\`json or introductory text:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "mindset" | "nutrition",
      "content": "string",
      "reason": "string",
      "imageKeyword": "string"
    }
  ]
}`;

function extractAndParseJSON(rawStr) {
  let cleaned = rawStr.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  return JSON.parse(cleaned);
}

async function run() {
  const start = Date.now();
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Generate 4 general exploration articles now.' }
      ],
      model: 'qwen/qwen3.6-27b',
      temperature: 0.5,
    });
    
    const rawContent = chatCompletion.choices[0]?.message?.content;
    const parsed = extractAndParseJSON(rawContent);
    console.log("Success! Articles generated:", parsed.articles?.length, "Time:", Date.now() - start, "ms");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
