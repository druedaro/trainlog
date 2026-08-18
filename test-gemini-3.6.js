import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GEMINI_API_KEY='));
const GEMINI_API_KEY = keyLine.split('=')[1].trim();

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const payload = JSON.stringify({ entries: [{ id: "1", text: "Me duele la espalda hoy pero hice peso muerto." }] }, null, 2);
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
    console.log("Parsed successfully.");
  } catch (error) {
    console.error("Error generating content:", error);
  }
}

test();
