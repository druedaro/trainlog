import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "AQ.Ab8RN6LelqGYScv0ops6Gun9I3kaUzCXb0p9Lrs3jhF4FjBvNw";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function test() {
  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: Buffer.from("fake data").toString('base64'),
          }
        },
        "Por favor, transcribe este audio con la mayor precisión posible. Es un diario de entrenamiento en español. Devuelve SOLO la transcripción, sin ningún otro comentario o formato."
      ]
    });
    console.log("Success");
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
