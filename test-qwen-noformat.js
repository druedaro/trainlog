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

Content Rules:
1. Generate exactly 4 articles. ALL 4 articles MUST be strictly for the 'training' category, but exploring 4 DIFFERENT specific topics within it.
2. The 'reason' field must explain why this topic is crucial from an evolutionary or scientific standpoint.
3. The 'imageKeyword' field must be a SINGLE ENGLISH WORD that represents the topic.
4. The 'emoji' field should be a single emoji representing the article topic.
5. The 'id' field should be a short, unique slug.
6. Do NOT diagnose injuries or prescribe medical treatments.
7. You MUST write ALL generated content strictly in Spanish.
8. Do NOT use markdown formatting inside the 'title' field.

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
  let cleanedContent = rawStr.trim();
  const jsonMatch = cleanedContent.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    cleanedContent = jsonMatch[0];
  }
  return JSON.parse(cleanedContent);
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
