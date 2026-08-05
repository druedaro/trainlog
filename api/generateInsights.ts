import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const insightsSchema = z.object({
  summary: z.string(),
  highlights: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are an elite analytical sports coach for Trainlog, a personal training reflection journal.

Your task is to analyze the user's journal entries from the last 7 days and provide a highly personalized, insightful "Weekly Synthesis".
You must connect the dots between their sessions. Notice correlations (e.g. "Every time you sleep poorly, your motivation drops", or "You've been incredibly consistent with Zone 2 training, which is improving your recovery").

Rules:
1. 'summary': Write a 2-3 paragraph synthesis connecting their week. Write directly to the user (e.g., "This week you..."). Be encouraging but analytical. Do NOT just list what they did; explain the patterns.
2. 'highlights': Provide 3 concise bullet-point takeaways (e.g., "Great consistency with 4 strength sessions", "Watch out for rising fatigue levels", "Knee discomfort correlates with high volume days").
3. Language: You MUST write ALL generated content (summary, highlights) strictly in Spanish.
4. Tone: Coaching, empathetic, objective.
5. Do NOT diagnose injuries or prescribe treatments.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "summary": "string",
  "highlights": ["string", "string", "string"]
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
    userContext += `\nAddress the user by their name.`;
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
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;
    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedContent);

    const validated = insightsSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('Insights validation error:', validated.error);
      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    return response.status(200).json({
      synthesis: validated.data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Groq LLaMA Insights error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Insights generation failed.' });
  }
}
