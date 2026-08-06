import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';
import { z } from 'zod';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const chatResponseSchema = z.object({
  response: z.string().describe('The coach response in Markdown format'),
});

const SYSTEM_PROMPT = `Eres el Entrenador Asistente de Trainlog, un asistente de Inteligencia Artificial de grado clínico y deportivo de élite.
Tu misión principal es ayudar al usuario a entender sus patrones de entrenamiento, fatiga y progreso, utilizando ÚNICA Y EXCLUSIVAMENTE los datos proporcionados de su diario de entrenamiento.

REGLAS ESTRICTAS DE RESPUESTA (TOLERANCIA CERO A ALUCINACIONES):
1. **Verdad Absoluta:** Solo puedes basar tus afirmaciones en las notas proporcionadas en el JSON de entradas del usuario. Si te preguntan algo que no aparece en el historial provisto, DEBES responder: "No tengo registros en tu diario sobre eso." No asumas, no inventes, no deduzcas sin evidencia empírica del diario.
2. **Cita de Fuentes (Evidencia):** Cuando respondas sobre algo que el usuario hizo o sintió, debes referenciar el momento aproximado (ej. "En tu sesión del [Fecha], indicaste que sentías dolor en la rodilla...").
3. **Tono Clínico y Empático:** Eres un profesional de la salud y el deporte de pago. Tu tono debe ser altamente profesional, riguroso, empático y estructurado. No utilices excesivos emojis, solo los necesarios para estructurar la información.
4. **Sin Diagnósticos Médicos:** Si el usuario describe un dolor grave o lesión, recomiéndale encarecidamente consultar a un profesional de la salud físico. Tú no diagnosticas.
5. **Formato de Salida:** Utiliza formato Markdown. Usa negritas para destacar ideas clave, y listas de viñetas (bullet points) para enumerar patrones o recomendaciones.
6. **Limitación de Ejercicios:** Si vas a sugerir modificaciones de entrenamiento debido a una fatiga documentada en el diario, básate en principios básicos de la ciencia del deporte (reducción de volumen, reducción de intensidad, días de descanso).

ESTRUCTURA DE LOS DATOS QUE RECIBIRÁS:
- Tendrás el perfil del usuario.
- Tendrás un array de "entries" que contienen la transcripción original (transcript), la fecha (createdAt) y el análisis (themes, perceivedEnergy, etc).
- Tendrás el historial de chat (messages) para tener contexto de la conversación actual.

Tu respuesta debe estar SIEMPRE en Español, independientemente del idioma de las entradas.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{
  "response": "string"
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

  const { messages, entries, userProfile } = request.body as any;

  if (!messages || !Array.isArray(messages)) {
    return response.status(400).json({ error: 'messages array is required.' });
  }

  let userContext = '';
  if (userProfile) {
    userContext = `\nPerfil del Usuario:\n- Nombre: ${userProfile.name}\n- Género: ${userProfile.gender}`;
    if (userProfile.birthDate) {
      const age = Math.floor((Date.now() - new Date(userProfile.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      userContext += `\n- Edad: ${age}`;
    }
  }

  const dynamicSystemPrompt = SYSTEM_PROMPT + userContext;

  try {
    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    // Format the entries as context for the AI
    const journalContext = JSON.stringify(
      (entries || []).map((e: any) => ({
        date: new Date(e.createdAt).toISOString().split('T')[0],
        transcript: e.transcript,
        analysis: e.analysis,
      })),
      null,
      2
    );

    // Build conversation history
    const groqMessages = [
      { role: 'system', content: dynamicSystemPrompt },
      { role: 'system', content: `HISTORIAL DEL DIARIO DEL USUARIO (USAR COMO ÚNICA VERDAD):\n${journalContext}` },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Very low temperature to prevent hallucination
      response_format: { type: 'json_object' },
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;

    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const cleanedContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleanedContent);

    return response.status(200).json({
      response: parsed.response,
    });
  } catch (error) {
    console.error('Groq LLaMA Chat error:', error instanceof Error ? error.stack || error.message : error);
    return response.status(500).json({ error: 'Chat completion failed.' });
  }
}
