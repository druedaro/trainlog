import Groq from 'groq-sdk';
import fs from 'fs';
import { z } from 'zod';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  emoji: z.string(),
  category: z.enum(['recovery', 'training', 'mindset', 'nutrition']),
  content: z.string(),
  reason: z.string(),
  imageKeyword: z.string(),
});

const exploreResponseSchema = z.object({
  articles: z.array(articleSchema),
});

const SYSTEM_PROMPT = `You are a world-class sports science content curator for Trainlog, heavily inspired by the style and philosophy of "Fitness Revolucionario" (Marcos Vázquez).

Your task is to produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles.

CRITICAL: These are NOT personalized to a specific user. They are general exploration articles.

Philosophical and Stylistic Guidelines (Fitness Revolucionario style):
- Focus on evolutionary biology (our ancestral origins vs modern environment mismatches).
- Challenge modern dogmas (e.g., "eat 5 times a day", "cardio is the only way to lose weight", "saturated fats are the devil").
- Integrate Stoicism and ancient philosophy into mindset (e.g., voluntary discomfort, resilience, memento mori).
- Promote functional movement, strength training as the foundation of health, kettlebells, calisthenics, and barefoot/minimalist running.
- Tone should be objective, scientifically rigorous, slightly rebellious, and direct.

Quality Standards:
1. ADVANCED INSIGHTS: Cover deep physiological, evolutionary, or psychological concepts. Explain the "why" at a cellular or evolutionary level.
2. CONCISENESS: Articles must be highly impactful but concise (maximum 3-4 paragraphs each). Get straight to the science and actionable takeaways. It is absolutely CRITICAL that you generate ALL 4 articles without truncating the list.
3. EVIDENCE-BASED: Reference real scientific studies, meta-analyses, or anthropological evidence whenever possible. Use formats like: "Según un estudio reciente en Nature..." or "La evidencia antropológica sugiere..."
4. SOURCES SECTION: Every article MUST end with a "## 📚 Fuentes y lectura recomendada" section listing 2-3 real, verifiable references (studies or books).
5. STRUCTURE: Use Markdown with clear sections (## headers), bold key concepts, bullet points for protocols, and emojis for visual appeal.

Content Rules:
1. Generate exactly 4 articles. ALL 4 articles MUST be strictly for the 'training' category, but exploring 4 DIFFERENT specific topics within it.
2. The 'reason' field must explain why this topic is crucial from an evolutionary or scientific standpoint.
3. The 'imageKeyword' field must be a SINGLE ENGLISH WORD that represents the topic (e.g., "ancestral", "sleep", "kettlebell", "steak"). We will use this to fetch a stock image from Unsplash.
4. The 'emoji' field should be a single emoji representing the article topic.
5. The 'id' field should be a short, unique slug.
6. Do NOT diagnose injuries or prescribe medical treatments.
7. You MUST write ALL generated content strictly in Spanish.
8. Do NOT use markdown formatting (like **bold**) inside the 'title' field. It must be plain text.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "mindset" | "nutrition",
      "content": "string (Markdown, extensive, MUST include ## 📚 Fuentes y lectura recomendada section at the end)",
      "reason": "string",
      "imageKeyword": "string"
    }
  ]
}`;

async function run() {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Generate 4 general exploration articles now.' }
      ],
      model: 'qwen/qwen3.6-27b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });
    
    const rawContent = chatCompletion.choices[0]?.message?.content;
    const parsed = JSON.parse(rawContent);
    const validated = exploreResponseSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error("Validation failed:", JSON.stringify(validated.error.issues, null, 2));
      console.log("Raw output:", rawContent);
    } else {
      console.log("Success! Articles generated:", validated.data.articles.length);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
