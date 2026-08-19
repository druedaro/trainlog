import Groq from 'groq-sdk';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const keyLine = envContent.split('\n').find(l => l.startsWith('GROQ_API_KEY='));
const GROQ_API_KEY = keyLine.split('=')[1].trim();

const groq = new Groq({ apiKey: GROQ_API_KEY });

async function run() {
  try {
    // Read a dummy audio file or just test the endpoints
    console.log("Key found:", !!GROQ_API_KEY);
    const audioFile = fs.createReadStream('package.json'); // Obviously not an audio file, but it will ping the API and we can check the error.
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'es',
    });
    console.log("Success:", transcription);
  } catch (error) {
    console.error("Audio API Error:", error.message);
  }
}

run();
