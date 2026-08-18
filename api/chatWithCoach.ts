import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const chatResponseSchema = z.object({
  response: z.string().describe('The coach response in Markdown format'),
  recommendedExercises: z.array(z.object({
    englishName: z.string(),
  })).default([]),
});

async function fetchExerciseGif(exercise: { englishName: string }): Promise<string | null> {
  try {
    const res = await fetch(
      `https://oss.exercisedb.dev/api/v1/exercises/search?search=${encodeURIComponent(exercise.englishName)}&threshold=0.8`
    );
    if (res.ok) {
      const json = (await res.json()) as any;
      if (json.success && json.data && json.data.length > 0) {
        const exerciseData = json.data[0];
        const standardName = exerciseData.name.split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return `\n**${standardName}**\n![${standardName}](${exerciseData.gifUrl})\n`;
      }
    }
  } catch (e) {

  }
  return null;
}

const SYSTEM_PROMPT = `Eres Anna, la entrenadora personal y asistente de Inteligencia Artificial de grado clínico y deportivo de élite de Trainlog.
Tu misión principal es acompañar al usuario en su día a día y ayudarle a entender sus patrones de entrenamiento, fatiga y progreso, utilizando ÚNICA Y EXCLUSIVAMENTE los datos proporcionados de su diario de entrenamiento. Cuando hables por primera vez o te refieras a ti misma, recuerda que te llamas Anna.

REGLAS ESTRICTAS DE RESPUESTA (TOLERANCIA CERO A ALUCINACIONES Y ANGLICISMOS):
1. **Verdad Absoluta:** Solo puedes basar tus afirmaciones en las notas proporcionadas en el JSON de entradas del usuario. Si te preguntan algo que no aparece en el historial provisto, DEBES responder: "No tengo registros en tu diario sobre eso." No asumas, no inventes, no deduzcas sin evidencia empírica del diario.
2. **Español Puro (CERO Anglicismos):** BAJO NINGÚN CONCEPTO utilices palabras en inglés para referirte a ejercicios, músculos o técnicas (como 'core', 'leg drive', 'curl', 'press', etc.). Usa siempre la terminología equivalente en español (ej. 'zona media', 'empuje de piernas', 'flexión de bíceps', 'empuje de banca').
3. **Cita de Fuentes (Evidencia):** Cuando respondas sobre algo que el usuario hizo o sintió, debes referenciar el momento aproximado (ej. "En tu sesión del [Fecha], indicaste que sentías dolor en la rodilla...").
4. **Tono Clínico y Empático:** Eres un profesional de la salud y el deporte de pago. Tu tono debe ser altamente profesional, riguroso, empático y estructurado. No utilices excesivos emojis.
5. **Formato de Salida:** Utiliza formato Markdown. Usa negritas para destacar ideas clave, y listas de viñetas para enumerar patrones.
6. **Recomendación de Ejercicios:** Si vas a sugerir ejercicios físicos, DEBES incluirlos en la lista 'recommendedExercises'. 
   - El campo 'englishName' DEBE ser el nombre estándar internacional en inglés de fitness/culturismo (ej. "barbell squat", "plank", "push up", "pull up", "deadlift", "dumbbell bicep curl"). Esto es crítico para buscar el vídeo correcto en la base de datos.
   - Si no hay ejercicios, deja la lista vacía.

ESTRUCTURA DE LOS DATOS QUE RECIBIRÁS:
- Perfil del usuario.
- Un array de "entries" que contienen la transcripción original, fecha y análisis.
- El historial de chat para tener contexto actual.

Debes devolver EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura:
{
  "response": "string",
  "recommendedExercises": [{"englishName": "string"}]
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

  if (!GEMINI_API_KEY) {
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
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    
    const journalContext = JSON.stringify(
      (entries || []).map((e: any) => ({
        date: new Date(e.createdAt).toISOString().split('T')[0],
        transcript: e.transcript,
        analysis: e.analysis,
      })),
      null,
      2
    );

    

    
    
    // Ensure contents starts with 'user' and alternates properly (Gemini requirement)
    // Also inject journalContext into the system prompt since we removed it before
    const finalSystemPrompt = dynamicSystemPrompt + "\n\nContexto del diario del usuario:\n" + journalContext;

    const formattedMessages = [];
    for (const m of messages) {
      if (!m.content) continue;
      const role = m.role === 'user' ? 'user' : 'model';
      
      // Prevent consecutive same-role messages or starting with 'model'
      if (formattedMessages.length === 0 && role === 'model') continue;
      
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
        formattedMessages[formattedMessages.length - 1].parts[0].text += "\n\n" + m.content;
      } else {
        formattedMessages.push({ role, parts: [{ text: m.content }] });
      }
    }

    if (formattedMessages.length === 0) {
      formattedMessages.push({ role: 'user', parts: [{ text: "Hola" }] });
    }

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: formattedMessages,
      config: {

        systemInstruction: finalSystemPrompt,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    const rawContent = aiResponse.text;

    if (!rawContent) {
      return response.status(502).json({ error: 'The analysis service returned an empty response.' });
    }

    const parsed = JSON.parse(rawContent);
    const validated = chatResponseSchema.safeParse(parsed);

    if (!validated.success) {

      return response.status(502).json({ error: 'The generated content did not meet validation standards.' });
    }

    let finalResponse = validated.data.response;

    if (validated.data.recommendedExercises.length > 0) {
      const gifResults = await Promise.all(
        validated.data.recommendedExercises.map(fetchExerciseGif)
      );
      const validGifs = gifResults.filter(Boolean);

      if (validGifs.length > 0) {
        finalResponse += '\n\n---\n\n**📹 Demostración de ejercicios recomendados:**\n' + validGifs.join('');
      }
    }

    return response.status(200).json({
      response: finalResponse,
    });
  } catch (error) {

    return response.status(500).json({ error: 'Chat completion failed.' });
  }
}
