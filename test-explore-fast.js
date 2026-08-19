import Groq from 'groq-sdk';
import fs from 'fs';
import { z } from 'zod';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a sports science content curator.
Your task is to produce EXACTLY 4 general exploration articles.

Quality Standards:
1. CONCISENESS: Articles must be EXTREMELY short and impactful (maximum 1 paragraph each). Get straight to the science and actionable takeaways. It is absolutely CRITICAL that you generate ALL 4 articles within 5 seconds.
2. EVIDENCE-BASED: Reference real scientific studies whenever possible.

Content Rules:
1. Generate exactly 4 articles. ALL 4 articles MUST be strictly for the 'training' category, but exploring 4 DIFFERENT specific topics within it.
2. The 'reason' field must explain why this topic is crucial.
3. The 'imageKeyword' field must be a SINGLE ENGLISH WORD.
4. The 'emoji' field should be a single emoji.
5. The 'id' field should be a short, unique slug.
6. You MUST write ALL generated content strictly in Spanish.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "mindset" | "nutrition",
      "content": "string (Markdown, short 1 paragraph)",
      "reason": "string",
      "imageKeyword": "string"
    }
  ]
}`;

async function run() {
  const start = Date.now();
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Generate 4 general exploration articles now.' }
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });
    
    const rawContent = chatCompletion.choices[0]?.message?.content;
    const parsed = JSON.parse(rawContent);
    console.log("Success! Articles generated:", parsed.articles?.length, "Time:", Date.now() - start, "ms");
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
