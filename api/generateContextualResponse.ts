import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const responseSchema = z.object({
  response: z.string().nullable(),
  recommendedExercises: z.array(z.string()).default([]),
});

const SYSTEM_PROMPT = `You are a sports reflection analysis assistant for Trainlog.
Your task is to provide a brief contextual response to the user's latest training entry, considering their recent history.

Rules:
1. Minimum Intervention Principle: If the session was completely normal and satisfying, return null. Do not generate generic "good job" advice merely to appear useful.
2. Empathetic Support: If the user expresses feeling weak, fatigued, frustrated, or unmotivated (even in a single session), provide moral support and encouragement.
3. Specific & Actionable: Avoid generic advice. Instead of "do core exercises", give specific examples like "**Plank**" or "**Bird-Dog**".
4. Formatting: Use Markdown. Bold the names of specific exercises (**Exercise**). Use bullet points for lists. Use emojis (e.g., 🧘‍♂️, 🛌, 💧) to make the text visual.
5. Exercise Recommendations: ONLY recommend exercises if the user specifically needs physical training, mobility, or stretching advice. DO NOT recommend exercises for nutrition or general fatigue issues. If you do recommend exercises, YOU MUST provide their exact STANDARD ENGLISH names in the 'recommendedExercises' array (e.g., ["plank", "assisted hanging knee raise"]). Leave the array empty if no physical exercises are needed.
6. Do NOT diagnose injuries, diseases, or psychological conditions. Do NOT prescribe medical treatments.
7. Speak directly to the user in a supportive, coaching tone (e.g., "Noté que te sientes agotado hoy...").
8. You will receive the 'currentEntry' and an array of 'recentEntries' (ordered newest to oldest). Use the history to spot repeating patterns if applicable.
9. IMPORTANT: You MUST write the 'response' strictly in Spanish.

Respond ONLY with a valid raw JSON object matching this exact structure:
{
  "response": "string" | null,
  "recommendedExercises": ["string"]
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

  const { currentEntry, recentEntries, userProfile } = request.body as any;

  if (!currentEntry) {
    return response.status(400).json({ error: 'currentEntry is required.' });
  }

  let userContext = '';
  if (userProfile) {
    userContext = `\nUser Profile:\n- Name: ${userProfile.name}\n- Gender: ${userProfile.gender}`;
    if (userProfile.birthDate) {
      const age = Math.floor((Date.now() - new Date(userProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      userContext += `\n- Age: ${age}`;
    }
  }

  const dynamicSystemPrompt = SYSTEM_PROMPT + userContext;

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    const payload = JSON.stringify({
      currentEntry,
      recentEntries: Array.isArray(recentEntries) ? recentEntries : [],
    }, null, 2);

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

    const validated = responseSchema.safeParse(parsed);

    if (!validated.success) {
      return response.status(502).json({ error: 'The analysis did not meet validation standards.' });
    }

    const { response: aiResponse, recommendedExercises } = validated.data;
    let finalResponse = aiResponse;

    if (finalResponse && recommendedExercises && recommendedExercises.length > 0) {
      finalResponse += '\n\n**Visual References:**\n';
      
      const fetchPromises = recommendedExercises.map(async (exercise) => {
        try {
          const res = await fetch(`https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(exercise)}&threshold=0.5`);
          if (res.ok) {
            const json = await res.json() as any;
            if (json.success && json.data && json.data.length > 0) {
              const exerciseData = json.data[0];
              return `\n**${exerciseData.name}**\n![${exerciseData.name}](${exerciseData.gifUrl})\n`;
            }
          }
        } catch (e) {

        }
        return null;
      });

      const results = await Promise.all(fetchPromises);
      const validResults = results.filter(Boolean);
      
      if (validResults.length > 0) {
        finalResponse += validResults.join('');
      } else {
        finalResponse = finalResponse.replace('\n\n**Visual References:**\n', '');
      }
    }

    return response.status(200).json({ response: finalResponse });
  } catch (error) {

    return response.status(500).json({ error: 'Contextual response execution failed.' });
  }
}
