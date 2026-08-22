import type { VercelRequest, VercelResponse } from '@vercel/node';
import Groq from 'groq-sdk';

const GROQ_API_KEY = process.env.GROQ_API_KEY;

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

  const { verifyFirebaseToken } = await import('./_lib/verifyToken.js');
  const decodedToken = await verifyFirebaseToken(authHeader.split('Bearer ')[1] ?? '');

  if (!decodedToken) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const { checkRateLimit } = await import('./_lib/ratelimit.js');
  const isAllowed = await checkRateLimit(decodedToken.uid);
  if (!isAllowed) {
    return response.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  if (!GROQ_API_KEY) {

    return response.status(500).json({ error: 'Transcription service is not configured.' });
  }

  try {
    const contentType = request.headers['content-type'] ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return response.status(400).json({ error: 'Expected multipart/form-data with an audio file.' });
    }

    const chunks: Buffer[] = [];

    await new Promise<void>((resolve, reject) => {
      request.on('data', (chunk: Buffer) => chunks.push(chunk));
      request.on('end', resolve);
      request.on('error', reject);
    });

    const body = Buffer.concat(chunks);

    if (body.length === 0) {
      return response.status(400).json({ error: 'No audio data received.' });
    }

    const boundary = contentType.split('boundary=')[1];

    if (!boundary) {
      return response.status(400).json({ error: 'Invalid multipart boundary.' });
    }

    const audioBuffer = extractFileFromMultipart(body, boundary);

    if (!audioBuffer || audioBuffer.length === 0) {
      return response.status(400).json({ error: 'No audio file found in the request.' });
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    

    
    
    const { toFile } = await import('groq-sdk');
    const audioFile = await toFile(audioBuffer, 'recording.webm', { type: 'audio/webm' });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3-turbo',
      language: 'es',
      prompt: 'El usuario está grabando un diario de entrenamiento en español. Habla sobre deporte, gimnasio, pesas, ejercicios, repeticiones, series, nutrición, calorías, peso corporal, descanso, sueño y recuperación física.',
    });
    const transcript = (transcription.text ?? '').trim();

    if (transcript.length === 0) {
      return response.status(422).json({ error: 'The recording could not be transcribed. It may be too short or unclear.' });
    }

    return response.status(200).json({ transcript });
  } catch (error) {
    
    return response.status(500).json({ error: 'Transcription failed. Please try again.' });
  }
}

function extractFileFromMultipart(body: Buffer, boundary: string): Buffer | null {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  
  let startIndex = body.indexOf(boundaryBuffer);
  if (startIndex === -1) return null;
  
  while (startIndex !== -1) {
    const endBoundaryIndex = body.indexOf(boundaryBuffer, startIndex + boundaryBuffer.length);
    const partEndIndex = endBoundaryIndex !== -1 ? endBoundaryIndex : body.length;
    
    const part = body.subarray(startIndex, partEndIndex);
    
    const headerEndIndex = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEndIndex !== -1) {
      const headerStr = part.subarray(0, headerEndIndex).toString('utf-8');
      if (headerStr.includes('filename=')) {
        let fileData = part.subarray(headerEndIndex + 4);
        
        if (fileData.length >= 2 && fileData[fileData.length - 2] === 13 && fileData[fileData.length - 1] === 10) {
          fileData = fileData.subarray(0, fileData.length - 2);
        }
        
        if (fileData.length >= 2 && fileData[fileData.length - 2] === 45 && fileData[fileData.length - 1] === 45) {
           fileData = fileData.subarray(0, fileData.length - 2);
        }
        
        return fileData;
      }
    }
    
    startIndex = endBoundaryIndex;
  }
  
  return null;
}
