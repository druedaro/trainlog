import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const monthlySummarySchema = z.object({
  narrative: z.string(),
  topThemes: z.array(z.string()),
});

const MONTHLY_PROMPT = `You are an elite analytical sports coach for Trainlog.

Your task is to analyze ALL the user's journal entries from a FULL MONTH and provide a comprehensive, insightful "Monthly Recap".

Rules:
1. 'narrative': Write 3-4 paragraphs directly to the user (use "Este mes tú..."). Focus on progress patterns, consistency, emotional trends, and evolution throughout the month. Be encouraging, analytical, and forward-looking.
2. 'topThemes': List the 5 most recurring themes/topics from the entries (e.g. "fuerza", "recuperación", "motivación").
3. Language: You MUST write ALL generated content strictly in Spanish.
4. Tone: Like a personal coach reviewing the full month with the user.
5. Do NOT diagnose injuries or prescribe treatments.

Respond ONLY with a valid raw JSON object:
{
  "narrative": "string",
  "topThemes": ["string", "string", "string", "string", "string"]
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

  const { entries, userProfile, month } = request.body as any;
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
    userContext += `\nAddress the user by their name.`;
  }
  if (month) {
    userContext += `\nThis analysis covers the month: ${month}.`;
  }

  const dynamicPrompt = MONTHLY_PROMPT + userContext;

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const payload = JSON.stringify({ entries }, null, 2);

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: dynamicPrompt },
        { role: 'user', content: payload },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;
    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedContent);

    const validated = monthlySummarySchema.safeParse(parsed);
    if (!validated.success) {
      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    return response.status(200).json({
      narrative: validated.data.narrative,
      topThemes: validated.data.topThemes,
      updatedAt: Date.now(),
    });
  } catch (error) {
    return response.status(500).json({ error: 'Monthly summary generation failed.' });
  }
}
