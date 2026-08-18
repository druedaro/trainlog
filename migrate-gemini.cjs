const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'api');
const files = fs.readdirSync(apiDir).filter(f => f.endsWith('.ts'));

for (const file of files) {
  let content = fs.readFileSync(path.join(apiDir, file), 'utf-8');
  
  // Replace imports
  content = content.replace("import Groq from 'groq-sdk';", "import { GoogleGenAI } from '@google/genai';");
  
  // Replace GROQ_API_KEY with GEMINI_API_KEY
  content = content.replace(/GROQ_API_KEY/g, "GEMINI_API_KEY");
  
  // For standard chat completions
  if (content.includes('groq.chat.completions.create')) {
    content = content.replace(/const groq = new Groq\(\{ apiKey: GEMINI_API_KEY \}\);/, "const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });");
    
    // Find the prompt and payload variables
    let promptVar = 'SYSTEM_PROMPT';
    if (content.includes('dynamicSystemPrompt')) promptVar = 'dynamicSystemPrompt';
    if (content.includes('dynamicPrompt')) promptVar = 'dynamicPrompt';
    
    let contentVar = 'payload';
    if (content.includes('transcript')) contentVar = 'transcript';
    
    // Replace chatCompletion with Gemini call
    const groqCallRegex = /const chatCompletion = await groq\.chat\.completions\.create\(\{[\s\S]*?\}\);/g;
    
    // Special case for chatWithCoach where we pass history
    if (file === 'chatWithCoach.ts') {
        const geminiCall = `const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: ${promptVar},
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });`;
        content = content.replace(groqCallRegex, geminiCall);
        // Remove groqMessages logic
        content = content.replace(/const groqMessages = \[[\s\S]*?\];/g, '');
    } else {
        const geminiCall = `const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: ${contentVar},
      config: {
        systemInstruction: ${promptVar},
        temperature: 0.5,
        responseMimeType: "application/json"
      }
    });`;
        content = content.replace(groqCallRegex, geminiCall);
    }
    
    // Replace response extraction
    content = content.replace(/const rawContent = chatCompletion\.choices\[0\]\?\.message\?\.content;/g, "const rawContent = aiResponse.text;");
    
    // Replace JSON parsing if extractAndParseJSON is used (we can just use JSON.parse now, or keep it, let's keep JSON.parse)
    content = content.replace(/const parsed = extractAndParseJSON\(rawContent\);/g, "const parsed = JSON.parse(rawContent);");
    content = content.replace(/import { extractAndParseJSON } from '\.\/lib\/jsonParser\.js';\n/g, "");
  }

  // Handle transcribeAudio specially
  if (file === 'transcribeAudio.ts') {
      content = content.replace(/const groq = new Groq\(\{ apiKey: GEMINI_API_KEY \}\);/, "const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });");
      content = content.replace(/const audioFile = new File.*?\n.*?\}\);/s, "");
      
      const geminiAudioCall = `
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'audio/webm',
            data: Buffer.from(audioBuffer).toString('base64'),
          }
        },
        "Por favor, transcribe este audio con la mayor precisión posible. Es un diario de entrenamiento en español. Devuelve SOLO la transcripción, sin ningún otro comentario o formato."
      ]
    });
    const transcript = (aiResponse.text ?? '').trim();`;
      content = content.replace(/const transcription = await groq\.audio\.transcriptions\.create\(\{[\s\S]*?\}\);\n\n\s*const transcript = \(transcription\.text \?\? ''\)\.trim\(\);/g, geminiAudioCall);
  }

  fs.writeFileSync(path.join(apiDir, file), content);
}

// Remove jsonParser
if (fs.existsSync(path.join(apiDir, 'lib', 'jsonParser.ts'))) {
  fs.unlinkSync(path.join(apiDir, 'lib', 'jsonParser.ts'));
}

console.log("Migration script complete");
