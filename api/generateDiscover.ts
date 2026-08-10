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
  recommendedExercises: z.array(z.object({
    englishName: z.string(),
  })).default([]),
});

const discoverResponseSchema = z.object({
  articles: z.array(articleSchema),
});

const SYSTEM_PROMPT = `You are a world-class sports science content curator and advanced coach for Trainlog.

Your task is to analyze the user's recent training journal entries and produce EXACTLY 4 high-value, in-depth, and FASCINATING educational articles (one for each category: recovery, training, mindset, nutrition) that are deeply tied to the user's specific situation. 

CRITICAL: Avoid generic, repetitive, or basic advice (e.g., "sleep 8 hours", "drink more water", "eat protein"). The user is an advanced athlete looking for deep, scientific, and niche insights. These articles must feel like reading a premium, highly scientific fitness blog (think Fitness Revolucionario, Stronger by Science, Huberman Lab, or Barbell Medicine). 

Quality Standards:
1. ADVANCED INSIGHTS: Connect the user's specific struggles or achievements to advanced physiological, biomechanical, or psychological concepts (e.g., periodization tactics, CNS fatigue, hypertrophy mechanisms, psychological framing).
2. DEPTH: Each article must be 400-600 words. Cover the topic thoroughly with actionable, non-obvious takeaways. NO superficial "5 tips" lists.
3. EVIDENCE-BASED: Reference real scientific studies, authors, or institutions whenever possible. Use formats like:
   - "Según un meta-análisis de Schoenfeld et al. (2017)..."
   - "Como explica Brad Schoenfeld en su investigación sobre hipertrofia..."
4. SOURCES SECTION: Every article MUST end with a "## 📚 Fuentes y lectura recomendada" section listing 2-3 real, verifiable references.
5. EXTREME PERSONALIZATION: Connect the content directly to the user's entries. Mention their specific pain points, emotions, exercises, or exact quotes from their entries as the premise for the article.
6. STRUCTURE: Use Markdown with clear sections (## headers), bold key concepts, bullet points for protocols, and emojis for visual appeal.

Content Rules:
1. Generate exactly 4 articles, one for each category: recovery, training, mindset, nutrition.
2. The 'reason' field must explain WHY this article is relevant to the user, referencing their exact entries.
3. If an article recommends specific physical exercises, include them in the 'recommendedExercises' array as objects with 'englishName' (the EXACT STANDARD ENGLISH name for the exercise database search). Leave the array empty otherwise.
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
      "content": "string (Markdown, 400-600 words, MUST include ## 📚 Fuentes y lectura recomendada section at the end)",
      "reason": "string",
      "recommendedExercises": [{"englishName": "string"}]
    }
  ]
}`;

async function fetchExerciseGif(exercise: { englishName: string }): Promise<string | null> {
  try {
    const res = await fetch(
      `https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(exercise.englishName)}&threshold=0.5`
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      if (json.success && json.data && json.data.length > 0) {
        const exerciseData = json.data[0];
        const standardName = exerciseData.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return `\n**${standardName}**\n![${standardName}](${exerciseData.gifUrl})\n`;
      }
    }
  } catch (e) {
    console.error(`Failed to fetch GIF for ${exercise.englishName}`, e);
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

  const { entries, userProfile } = request.body as any;

  if (!entries || !Array.isArray(entries) || entries.length === 0) {
    return response.status(400).json({ error: 'At least one entry is required.' });
  }

  let userContext = '';
  if (userProfile) {
    userContext = `\nUser Profile:\n- Name: ${userProfile.name}\n- Gender: ${userProfile.gender}`;
    if (userProfile.birthDate) {
      const age = Math.floor((Date.now() - new Date(userProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      userContext += `\n- Age: ${age}`;
    }
    userContext += `\nAddress the user by their name in the articles.`;
  }

  const dynamicSystemPrompt = SYSTEM_PROMPT + userContext;

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const payload = JSON.stringify({ entries }, null, 2);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicSystemPrompt },
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
            article.recommendedExercises.map((ex: any) => fetchExerciseGif(ex)),
          );
          const validGifs = gifResults.filter(Boolean);

          if (validGifs.length > 0) {
            enrichedContent += '\n\n---\n\n**📹 Demostración de ejercicios:**\n' + validGifs.join('');
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
