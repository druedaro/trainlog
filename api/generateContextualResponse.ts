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
1. Minimum Intervention Principle: If the session was completely normal and satisfying, return null. Do not generate generic "good job" advice merely to appear useful.
2. Empathetic Support: If the user expresses feeling weak, fatigued, frustrated, or unmotivated (even in a single session), provide moral support and encouragement.
3. Specific & Actionable: Avoid generic advice. Instead of "do core exercises", give specific examples like "**Plancha Abdominal (Plank)**" or "**Bird-Dog**".
4. Formatting: Use Markdown. Bold the names of specific exercises (**Exercise**). Use bullet points for lists. Use emojis (e.g., 🧘‍♂️, 🛌, 💧) to make the text visual and act as infographics.
5. Do NOT diagnose injuries, diseases, or psychological conditions. Do NOT prescribe medical treatments.
6. Speak directly to the user in a supportive, coaching tone (e.g., "I noticed you're feeling drained today...").
7. You will receive the 'currentEntry' and an array of 'recentEntries' (ordered newest to oldest). Use the history to spot repeating patterns if applicable.

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
