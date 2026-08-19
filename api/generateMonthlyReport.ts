import { VercelRequest, VercelResponse } from '@vercel/node';
import { generateAIResponse, AI_MODELS } from './lib/groq';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

    const summary = await generateAIResponse(systemPrompt, 'Genera el párrafo motivacional.', AI_MODELS.DEFAULT);

    return res.status(200).json({ summary: summary.trim() });
  } catch (error: any) {
    console.error('Error generating monthly report:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
