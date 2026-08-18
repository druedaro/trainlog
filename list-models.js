import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "AQ.Ab8RN6LelqGYScv0ops6Gun9I3kaUzCXb0p9Lrs3jhF4FjBvNw";
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function run() {
  try {
    const models = await ai.models.list();
    for await (const model of models) {
        console.log(model.name);
    }
  } catch (e) {
    console.error(e);
  }
}
run();
