import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';

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

  if (!GOOGLE_GENAI_API_KEY) {
    console.error('GOOGLE_GENAI_API_KEY is not configured.');
    return response.status(500).json({ error: 'Analysis service is not configured.' });
  }

  const { transcript } = request.body as { transcript?: string };

  if (!transcript || transcript.trim().length === 0) {
    return response.status(400).json({ error: 'A non-empty transcript is required.' });
  }

  try {
    const genai = new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY });

    const result = await genai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [{ text: transcript }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.3,
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.text ?? '';

    let parsed: unknown;

    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Gemini returned invalid JSON:', responseText.slice(0, 200));
      return response.status(502).json({ error: 'The analysis service returned an invalid response. Please try again.' });
    }

    const validated = analysisResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('Gemini response failed validation:', validated.error.issues);
      return response.status(502).json({ error: 'The analysis did not meet expected quality standards. Please try again.' });
    }

    return response.status(200).json(validated.data);
  } catch (error) {
    console.error('Analysis error:', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
