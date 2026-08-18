const fs = require('fs');
const path = require('path');

const audioFile = path.join(__dirname, 'api', 'transcribeAudio.ts');
let content = fs.readFileSync(audioFile, 'utf-8');

content = content.replace(/contents:\s*\[[\s\S]*?\]\s*\}\);/g, `contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: 'audio/webm',
              data: Buffer.from(audioBuffer).toString('base64'),
            }
          },
          { text: "Por favor, transcribe este audio con la mayor precisión posible. Es un diario de entrenamiento en español. Devuelve SOLO la transcripción, sin ningún otro comentario o formato." }
        ]
      }]
    });`);

fs.writeFileSync(audioFile, content);
console.log("Fixed audio payload format");
