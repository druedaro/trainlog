const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(apiDir, file), 'utf-8');
  
  // Replace imports
  content = content.replace("import { GoogleGenAI } from '@google/genai';", "import Groq from 'groq-sdk';");
  
  // Replace API Key name
  content = content.replace(/GEMINI_API_KEY/g, "GROQ_API_KEY");
  
  // Replace the initialization
  content = content.replace(/const ai = new GoogleGenAI\(\{ apiKey: GROQ_API_KEY \}\);/g, "const groq = new Groq({ apiKey: GROQ_API_KEY });");

  // Handle transcribeAudio specially
  if (file === 'transcribeAudio.ts') {
      const groqAudioCall = `
    const audioFile = new File([new Uint8Array(audioBuffer)], 'recording.webm', {
      type: 'audio/webm',
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'es',
      prompt: 'El usuario está grabando un diario de entrenamiento en español. Habla sobre deporte, gimnasio, pesas, ejercicios, repeticiones, series, nutrición, calorías, peso corporal, descanso, sueño y recuperación física.',
    });
    const transcript = (transcription.text ?? '').trim();`;

      content = content.replace(/const aiResponse = await ai\.models\.generateContent\(\{[\s\S]*?\}\);\n\s*const transcript = \(aiResponse\.text \?\? ''\)\.trim\(\);/g, groqAudioCall);
  } else if (file === 'chatWithCoach.ts') {
      // Replace the complex chat formatting with simple Groq format
      content = content.replace(/\/\/ Ensure contents starts with 'user'[\s\S]*?config: \{[\s\S]*?\}\s*\}\);/g, `
    const groqMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'qwen/qwen3.6-27b',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });`);
      content = content.replace(/const rawContent = aiResponse\.text;/g, "const rawContent = chatCompletion.choices[0]?.message?.content;");
  } else {
      // Standard JSON endpoints
      content = content.replace(/const aiResponse = await ai\.models\.generateContent\(\{[\s\S]*?\}\);/g, `
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: ${content.includes('dynamicSystemPrompt') ? 'dynamicSystemPrompt' : content.includes('finalPrompt') ? 'finalPrompt' : 'SYSTEM_PROMPT'} },
        { role: 'user', content: ${content.includes('transcript') ? 'transcript' : 'payload'} },
      ],
      model: 'qwen/qwen3.6-27b',
      temperature: 0.5,
      response_format: { type: 'json_object' }
    });`);
      content = content.replace(/const rawContent = aiResponse\.text;/g, "const rawContent = chatCompletion.choices[0]?.message?.content;");
  }

  fs.writeFileSync(path.join(apiDir, file), content);
}

console.log("Reverted to Groq");
