import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

Your task is to produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles (one for each category: recovery, training, mindset, nutrition).

CRITICAL: These are NOT personalized to a specific user. They are general exploration articles.

Philosophical and Stylistic Guidelines (Fitness Revolucionario style):
- Focus on evolutionary biology (our ancestral origins vs modern environment mismatches).
- Challenge modern dogmas (e.g., "eat 5 times a day", "cardio is the only way to lose weight", "saturated fats are the devil").
- Integrate Stoicism and ancient philosophy into mindset (e.g., voluntary discomfort, resilience, memento mori).
- Promote "Real Food" (comida real), fasting (ayuno intermitente), metabolic flexibility, and circadian rhythms.
- Promote functional movement, strength training as the foundation of health, kettlebells, calisthenics, and barefoot/minimalist running.
- Tone should be objective, scientifically rigorous, slightly rebellious, and direct.

Quality Standards:
1. ADVANCED INSIGHTS: Cover deep physiological, evolutionary, or psychological concepts. Explain the "why" at a cellular or evolutionary level.
2. DEPTH: Each article must be 400-600 words. Thorough, actionable, and non-obvious takeaways. NO superficial "5 tips" lists.
3. EVIDENCE-BASED: Reference real scientific studies, meta-analyses, or anthropological evidence whenever possible. Use formats like: "Según un estudio reciente en Nature..." or "La evidencia antropológica sugiere..."
4. SOURCES SECTION: Every article MUST end with a "## 📚 Fuentes y lectura recomendada" section listing 2-3 real, verifiable references (studies or books).
5. STRUCTURE: Use Markdown with clear sections (## headers), bold key concepts, bullet points for protocols, and emojis for visual appeal.

Content Rules:
1. Generate exactly 4 articles, one for each category: recovery, training, mindset, nutrition.
2. The 'reason' field must explain why this topic is crucial from an evolutionary or scientific standpoint.
3. The 'imageKeyword' field must be a SINGLE ENGLISH WORD that represents the topic (e.g., "ancestral", "sleep", "kettlebell", "steak"). We will use this to fetch a stock image from Unsplash.
4. The 'emoji' field should be a single emoji representing the article topic.
5. The 'id' field should be a short, unique slug.
6. Do NOT diagnose injuries or prescribe medical treatments.
7. You MUST write ALL generated content (titles, reason, content) strictly in Spanish.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "mindset" | "nutrition",
      "content": "string (Markdown, 400-600 words, MUST include ## 📚 Fuentes y lectura recomendada section at the end)",
      "reason": "string",
      "imageKeyword": "string"
    }
  ]
}`;


export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  const { verifyFirebaseToken } = await import('./lib/verifyToken.js');
  const decodedToken = await verifyFirebaseToken(authHeader.split('Bearer ')[1] ?? '');

  if (!decodedToken) {
    return response.status(401).json({ error: 'Invalid authentication token.' });
  }

  if (!GROQ_API_KEY) {
    return response.status(500).json({ error: 'Analysis service is not configured.' });
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: 'Generate 4 general exploration articles now.' },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedContent);

    const validated = exploreResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Explore validation error:', validated.error);
      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    const enrichedArticles = validated.data.articles.map((article) => {
      return {
        id: article.id,
        title: article.title,
        emoji: article.emoji,
        category: article.category,
        content: article.content,
        reason: article.reason,
        imageUrl: `https://loremflickr.com/800/600/fitness,${encodeURIComponent(article.imageKeyword)}/all`,
      };
    });

    return response.status(200).json({
      articles: enrichedArticles,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Groq LLaMA Discover error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Discover content generation failed.' });
  }
}
