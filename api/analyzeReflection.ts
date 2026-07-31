import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const analysisResponseSchema = z.object({
  summary: z.string().min(1),
  themes: z.array(z.string()).min(1),
  perceivedEnergy: z
    .enum(['very_low', 'low', 'moderate', 'high', 'very_high'])
    .nullable(),
  perceivedMood: z
    .enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive'])
    .nullable(),
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

Respond ONLY with valid JSON matching this exact structure:
{
  "summary": "string",
  "themes": ["string"],
  "perceivedEnergy": "very_low" | "low" | "moderate" | "high" | "very_high" | null,
  "perceivedMood": "very_negative" | "negative" | "neutral" | "positive" | "very_positive" | null,
  "activities": ["string"],
  "reflectionPrompt": "string" | null
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

    const responseText = chatCompletion.choices[0]?.message?.content;

    if (!responseText) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Groq LLaMA returned invalid JSON:', responseText.slice(0, 200));
      return response.status(502).json({ error: 'The analysis service returned invalid format. Please try again.' });
    }

    const validated = analysisResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Groq LLaMA response failed validation:', validated.error.issues);
      return response.status(502).json({ error: 'The analysis did not meet expected quality standards. Please try again.' });
    }

    return response.status(200).json(validated.data);
  } catch (error) {
    console.error('Groq LLaMA analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
