import { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { verifyFirebaseToken } = await import('./lib/verifyToken.js');
  const decodedToken = await verifyFirebaseToken(authHeader.split('Bearer ')[1] ?? '');

  if (!decodedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { checkRateLimit } = await import('./lib/ratelimit.js');
  const isAllowed = await checkRateLimit(decodedToken.uid);
  if (!isAllowed) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  try {
    const { month, entriesCount, maxStreak, topActivity, gender = 'masculino', age = 30 } = req.body;

    const systemPrompt = `Eres el entrenador personal IA de Trainlog (te llamas Anna).
Tu objetivo es generar un párrafo breve y muy motivador resumiendo el mes de entrenamiento del usuario.
Habla directamente al usuario de tú. Tono: energético, empático, directo.

Datos del mes (${month}):
- Entrenamientos completados: ${entriesCount}
- Actividad favorita: ${topActivity}
- Mejor racha de días seguidos: ${maxStreak}
- Perfil del usuario: ${gender}, ${age} años.

Escribe UN SOLO PÁRRAFO de máximo 40-50 palabras felicitándole, destacando sus logros de este mes, y animándole a superarse el próximo mes. Usa emojis. No incluyas saludos genéricos como "Hola", ve directo al grano. Adapta el lenguaje a su género (${gender}).`;

    const response = await groq.chat.completions.create({
      model: "llama-3.1-70b-versatile",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Genera el párrafo motivacional.' }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content?.trim() || "¡Qué gran mes! Sigue así.";

    return res.status(200).json({ summary });
  } catch (error: any) {
    
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
