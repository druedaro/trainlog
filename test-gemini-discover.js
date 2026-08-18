import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "AQ.Ab8RN6LelqGYScv0ops6Gun9I3kaUzCXb0p9Lrs3jhF4FjBvNw";

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const payload = JSON.stringify({ entries: [] }, null, 2);
const SYSTEM_PROMPT = `Generate some JSON for testing. Respond ONLY with a valid JSON array of objects.`;

async function test() {
  try {
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: payload,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });

    console.log("Response text:", aiResponse.text);
    const parsed = JSON.parse(aiResponse.text);
    console.log("Parsed JSON:", parsed);
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

test();
