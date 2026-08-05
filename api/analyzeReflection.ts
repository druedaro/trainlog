import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const validEnergies = ['very_low', 'low', 'moderate', 'high', 'very_high'] as const;
const validMoods = ['very_negative', 'negative', 'neutral', 'positive', 'very_positive'] as const;

const analysisResponseSchema = z.object({
  summary: z.string().min(1),
  themes: z.array(z.string()).min(1),
  perceivedEnergy: z.enum(validEnergies).nullable(),
  perceivedMood: z.enum(validMoods).nullable(),
  activities: z.array(z.string()),
  reflectionPrompt: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are a sports reflection analysis assistant for Trainlog, a personal sports reflection journal.

Your task is to analyze a user's voice transcript about their training experience and extract structured insights.

Rules:
- Summarize what the user expressed, do not add interpretations beyond what was said.
- Identify themes present in the reflection (e.g., fatigue, motivation, enjoyment, recovery).
- Only set perceivedEnergy and perceivedMood if the user clearly expressed them. Set to null otherwise.
- List activities mentioned. If none are mentioned, return an empty array.
- Provide a reflectionPrompt only when it adds meaningful value. Set to null when the session was stable and no prompt is needed.
- Do NOT diagnose injuries, diseases, or psychological conditions.
- Do NOT provide therapy or medical advice.
- Do NOT present interpretations as facts about the user.
- Keep the summary concise and respectful of what the user shared.
- IMPORTANT: You MUST output all generated text (summary, themes, activities, reflectionPrompt) in Spanish.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "summary": "string",
  "themes": ["string"],
  "perceivedEnergy": "very_low" | "low" | "moderate" | "high" | "very_high" | null,
  "perceivedMood": "very_negative" | "negative" | "neutral" | "positive" | "very_positive" | null,
  "activities": ["string"],
  "reflectionPrompt": "string" | null
}`;

function sanitizeAnalysisPayload(raw: any) {
  if (typeof raw !== 'object' || raw === null) return null;

  const summary = typeof raw.summary === 'string' && raw.summary.trim() ? raw.summary.trim() : 'Reflection recorded.';
  
  let themes = Array.isArray(raw.themes) ? raw.themes.filter((t: any) => typeof t === 'string' && t.trim()) : [];
  if (themes.length === 0) themes = ['general'];

  let activities = Array.isArray(raw.activities) ? raw.activities.filter((a: any) => typeof a === 'string' && a.trim()) : [];

  let perceivedEnergy: typeof validEnergies[number] | null = null;
  if (typeof raw.perceivedEnergy === 'string') {
    const normalized = raw.perceivedEnergy.toLowerCase().trim().replace(/[\s-]/g, '_');
    if ((validEnergies as readonly string[]).includes(normalized)) {
      perceivedEnergy = normalized as typeof validEnergies[number];
    }
  }

  let perceivedMood: typeof validMoods[number] | null = null;
  if (typeof raw.perceivedMood === 'string') {
    const normalized = raw.perceivedMood.toLowerCase().trim().replace(/[\s-]/g, '_');
    if ((validMoods as readonly string[]).includes(normalized)) {
      perceivedMood = normalized as typeof validMoods[number];
    }
  }

  const reflectionPrompt = typeof raw.reflectionPrompt === 'string' && raw.reflectionPrompt.trim() ? raw.reflectionPrompt.trim() : null;

  return {
    summary,
    themes,
    perceivedEnergy,
    perceivedMood,
    activities,
    reflectionPrompt,
  };
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
    console.error('GROQ_API_KEY is not configured.');
    return response.status(500).json({ error: 'Analysis service is not configured.' });
  }

  const { transcript } = request.body as { transcript?: string };

  if (!transcript || transcript.trim().length === 0) {
    return response.status(400).json({ error: 'A non-empty transcript is required.' });
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      console.error('Groq returned empty response body.');
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    // Strip markdown code fences if present
    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();

    let parsed: any;

    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseErr) {
      console.error('Groq LLaMA returned unparseable JSON:', rawContent);
      return response.status(502).json({ error: 'The analysis service returned an invalid JSON format.' });
    }

    const sanitized = sanitizeAnalysisPayload(parsed);

    if (!sanitized) {
      console.error('Failed to sanitize Groq payload:', parsed);
      return response.status(502).json({ error: 'The analysis response payload was invalid.' });
    }

    const validated = analysisResponseSchema.safeParse(sanitized);

    if (!validated.success) {
      console.error('Sanitized payload failed Zod schema:', validated.error.issues);
      return response.status(502).json({ error: 'The analysis did not meet validation standards.' });
    }

    return response.status(200).json(validated.data);
  } catch (error) {
    console.error('Groq LLaMA execution error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Analysis execution failed. Please try again.' });
  }
}
