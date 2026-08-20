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

Your task is to produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles.

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
2. CONCISENESS: Articles must be EXTREMELY short and impactful (maximum 1-2 paragraphs each). Get straight to the science and actionable takeaways. It is absolutely CRITICAL that you generate ALL 4 articles within the output limit.
3. EVIDENCE-BASED: Reference real scientific studies, meta-analyses, or anthropological evidence whenever possible. Use formats like: "Según un estudio reciente en Nature..." or "La evidencia antropológica sugiere..."
4. SOURCES SECTION: Include a brief "Fuentes" line at the end.
5. STRUCTURE: Use Markdown with clear sections (## headers), bold key concepts, bullet points for protocols, and emojis for visual appeal.

Content Rules:
1. Generate exactly 4 articles. {{CATEGORY_RULE}}
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
      "category": "recovery" | "training" | "mindset" | "nutrition" | "general",
      "content": "string (Markdown, extensive, MUST include ## 📚 Fuentes y lectura recomendada section at the end)",
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
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const { checkRateLimit } = await import('./lib/ratelimit.js');
  const isAllowed = await checkRateLimit(decodedToken.uid);
  if (!isAllowed) {
    return response.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!GROQ_API_KEY) {
    return response.status(500).json({ error: 'Analysis service is not configured.' });
  }

  const { category } = request.body || {};

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    let categoryRule = "One for each category: recovery, training, mindset, nutrition.";
    if (category && ['recovery', 'training', 'mindset', 'nutrition'].includes(category)) {
      categoryRule = `ALL 4 articles MUST be strictly for the '${category}' category, but exploring 4 DIFFERENT specific topics within it.`;
    } else if (category === 'general') {
      categoryRule = `ALL 4 articles MUST be about general fitness curiosities, scientific evidence, or unique insights, NOT strictly tied to the core themes.`;
    }

    const finalPrompt = SYSTEM_PROMPT.replace('{{CATEGORY_RULE}}', categoryRule);

    
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: finalPrompt },
        { role: 'user', content: 'Generate 4 general exploration articles now.' },
      ],
      model: 'openai/gpt-oss-120b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const parsed = JSON.parse(rawContent);

    const validated = exploreResponseSchema.safeParse(parsed);

    if (!validated.success) {

      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'JM_DldTer7pAVMlERjx5H-bbTP_EgBemd9XhfZl7-2s';

    const enrichedArticles = await Promise.all(
      validated.data.articles.map(async (article) => {
        let imageUrl = `https://loremflickr.com/800/600/fitness,${encodeURIComponent(article.imageKeyword)}/all`;
        try {
          const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(article.imageKeyword + ' fitness')}&per_page=10&orientation=landscape&client_id=${UNSPLASH_ACCESS_KEY}`);
          if (res.ok) {
            const data = await res.json() as any;
            if (data.results && data.results.length > 0) {
              const randomIndex = Math.floor(Math.random() * data.results.length);
              imageUrl = data.results[randomIndex].urls.regular;
            }
          }
        } catch (e) {

        }

        return {
          id: article.id,
          title: article.title,
          emoji: article.emoji,
          category: category || article.category,
          content: article.content,
          reason: article.reason,
          imageUrl,
        };
      })
    );

    return response.status(200).json({
      articles: enrichedArticles,
      updatedAt: Date.now(),
    });
  } catch (error) {

    return response.status(500).json({ error: 'Explore content generation failed.' });
  }
}
