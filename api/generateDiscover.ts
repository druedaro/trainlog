import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const articleSchema = z.object({
  id: z.string(),
  title: z.string(),
  emoji: z.string(),
  category: z.enum(['recovery', 'training', 'nutrition', 'mindset']),
  content: z.string(),
  reason: z.string(),
  recommendedExercises: z.array(z.string()).default([]),
});

const discoverResponseSchema = z.object({
  articles: z.array(articleSchema),
});

const SYSTEM_PROMPT = `You are a sports science educator for Trainlog, a personal training reflection journal.

Your task is to analyze the user's recent training journal entries and generate exactly 3 personalized educational articles ("Knowledge Pills") that are highly relevant to the user's current situation, goals, and recurring patterns.

Rules:
1. Generate exactly 3 articles. Each must be deeply relevant to the user's recent entries. Do NOT produce generic fitness content.
2. Each article must have a unique 'category' from: recovery, training, nutrition, mindset.
3. The 'reason' field must explain WHY you chose this article for the user (e.g., "You mentioned lower back tightness in 3 of your last 5 sessions.").
4. The 'content' field must be Markdown. Use headers (##), bold, bullet points, and emojis for visual appeal.
5. Content should be evidence-based and cite general scientific principles (e.g., "According to sports science research..." or "Studies suggest...").
6. Keep each article concise but valuable: 150-300 words.
7. If an article recommends specific exercises, include their EXACT STANDARD ENGLISH names in the 'recommendedExercises' array. The system will automatically fetch animated demonstrations.
8. The 'emoji' field should be a single emoji that visually represents the article topic.
9. The 'id' field should be a short, unique slug (e.g., "recovery-sleep-optimization").
10. Do NOT diagnose injuries or prescribe medical treatments.
11. Write in the same language the user uses in their entries.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "articles": [
    {
      "id": "string",
      "title": "string",
      "emoji": "string",
      "category": "recovery" | "training" | "nutrition" | "mindset",
      "content": "string (Markdown)",
      "reason": "string",
      "recommendedExercises": ["string"]
    }
  ]
}`;

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
