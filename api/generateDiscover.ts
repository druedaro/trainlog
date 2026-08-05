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
  recommendedExercises: z.array(z.string()).default([]),
});

const discoverResponseSchema = z.object({
  articles: z.array(articleSchema),
});

const SYSTEM_PROMPT = `You are a world-class sports science content curator for Trainlog, a personal training reflection journal.

Your task is to analyze the user's recent training journal entries and produce exactly 3 high-value, in-depth educational articles that are deeply relevant to the user's specific situation. These articles must feel like reading a premium fitness blog (think Fitness Revolucionario, Stronger by Science, or Barbell Medicine).

Quality Standards:
1. DEPTH: Each article must be 400-600 words. Cover the topic thoroughly with actionable takeaways. NO superficial "5 tips" lists.
2. EVIDENCE-BASED: Reference real scientific studies, authors, or institutions whenever possible. Use formats like:
   - "Según un meta-análisis de Schoenfeld et al. (2017)..."
   - "Un estudio publicado en el Journal of Strength and Conditioning Research demostró que..."
   - "Como explica Brad Schoenfeld en su investigación sobre hipertrofia..."
3. SOURCES SECTION: Every article MUST end with a "## 📚 Fuentes y lectura recomendada" section listing 2-3 real, verifiable references. Use this format:
   - **Nombre del estudio/artículo** — Autor(es), Revista/Fuente (Año)
   - Or for websites: **Título del artículo** — NombreDelSitio.com
   Prioritize sources from: PubMed, NSCA, ACSM, Stronger by Science, Barbell Medicine, Fitness Revolucionario, Journal of Strength and Conditioning Research.
4. PERSONALIZATION: Connect the content directly to the user's entries. Reference specific things they mentioned.
5. STRUCTURE: Use Markdown with clear sections (## headers), bold key concepts, bullet points for protocols, and emojis for visual appeal.

Content Rules:
1. Generate exactly 4 articles, one for each category: recovery, training, mindset, nutrition.
2. The 'reason' field must explain WHY this article is relevant to the user specifically.
3. If an article recommends specific physical exercises (and ONLY if relevant to physical training or mobility), include their EXACT STANDARD ENGLISH names in the 'recommendedExercises' array. DO NOT recommend exercises for nutrition or mindset articles unless directly relevant. Leave the array empty otherwise.
4. The 'emoji' field should be a single emoji representing the article topic.
5. The 'id' field should be a short, unique slug (e.g., "recovery-sleep-hrv").
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
      "recommendedExercises": ["string"]
    }
  ]
};`;

async function fetchExerciseGif(exerciseName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(exerciseName)}&threshold=0.5`
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      if (json.success && json.data && json.data.length > 0) {
        const exerciseData = json.data[0];
        return `\n**${exerciseData.name}**\n![${exerciseData.name}](${exerciseData.gifUrl})\n`;
      }
    }
  } catch (e) {
    console.error(`Failed to fetch GIF for ${exerciseName}`, e);
  }
  return null;
}

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

  const { entries } = request.body as any;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return response.status(400).json({ error: 'At least one entry is required.' });
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const payload = JSON.stringify({ entries }, null, 2);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
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

    const validated = discoverResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Discover validation error:', validated.error);
      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    // Enrich each article with ExerciseDB GIFs
    const enrichedArticles = await Promise.all(
      validated.data.articles.map(async (article) => {
        let enrichedContent = article.content;

        if (article.recommendedExercises.length > 0) {
          const gifResults = await Promise.all(
            article.recommendedExercises.map(fetchExerciseGif),
          );
          const validGifs = gifResults.filter(Boolean);

          if (validGifs.length > 0) {
            enrichedContent += '\n\n---\n\n**📹 Exercise Demonstrations:**\n' + validGifs.join('');
          }
        }

        return {
          id: article.id,
          title: article.title,
          emoji: article.emoji,
          category: article.category,
          content: enrichedContent,
          reason: article.reason,
        };
      }),
    );

    return response.status(200).json({
      articles: enrichedArticles,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Groq LLaMA Discover error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Discover content generation failed.' });
  }
}
