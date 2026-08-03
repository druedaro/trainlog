import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const responseSchema = z.object({
  response: z.string().nullable(),
});

const SYSTEM_PROMPT = `You are a sports reflection analysis assistant for Trainlog.
Your task is to provide a brief contextual response to the user's latest training entry, considering their recent history.

Rules:
1. Minimum Intervention Principle: Only provide a response if there is a meaningful pattern or insight (e.g., repeating fatigue across 3 sessions, a clear improvement, or connecting a theme).
2. If the current session is normal or there is nothing insightful to add, you MUST return null for the response. Do not generate advice merely to appear useful.
3. Keep the response very brief (1-2 short sentences).
4. Do NOT diagnose injuries, diseases, or psychological conditions.
5. Speak directly to the user (e.g., "I noticed you've been feeling fatigued...").
6. You will receive the 'currentEntry' and an array of 'recentEntries' (ordered newest to oldest). Note: recentEntries might include the current entry, so use the dates to differentiate.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "response": "string" | null
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

  const { currentEntry, recentEntries } = request.body as any;

  if (!currentEntry) {
    return response.status(400).json({ error: 'currentEntry is required.' });
  }

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    // We stringify the payload to send to the prompt
    const payload = JSON.stringify({
      currentEntry,
      recentEntries: Array.isArray(recentEntries) ? recentEntries : [],
    }, null, 2);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: payload },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedContent);

    // Validate structure
    const validated = responseSchema.safeParse(parsed);

    if (!validated.success) {
      return response.status(502).json({ error: 'The analysis did not meet validation standards.' });
    }

    return response.status(200).json(validated.data);
  } catch (error) {
    console.error('Groq LLaMA Contextual Response error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Contextual response execution failed.' });
  }
}
