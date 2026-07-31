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

  // Verify auth token
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return response.status(401).json({ error: 'Authentication required.' });
  }

  // Lazy-import firebase-admin to keep cold starts fast when not needed
  const { verifyFirebaseToken } = await import('./lib/verifyToken.js');
  const decodedToken = await verifyFirebaseToken(authHeader.split('Bearer ')[1] ?? '');

  if (!decodedToken) {
    return response.status(401).json({ error: 'Invalid authentication token.' });
  }

  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not configured.');
    return response.status(500).json({ error: 'Transcription service is not configured.' });
  }

  try {
    // Parse the multipart form data
    const contentType = request.headers['content-type'] ?? '';

    if (!contentType.includes('multipart/form-data')) {
      return response.status(400).json({ error: 'Expected multipart/form-data with an audio file.' });
    }

    // Vercel automatically parses multipart form data into request.body
    // For file uploads, we need to handle the raw body
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

    // Extract the audio file from multipart form data
    const boundary = contentType.split('boundary=')[1];

    if (!boundary) {
      return response.status(400).json({ error: 'Invalid multipart boundary.' });
    }

    const audioBuffer = extractFileFromMultipart(body, boundary);

    if (!audioBuffer || audioBuffer.length === 0) {
      return response.status(400).json({ error: 'No audio file found in the request.' });
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });

    // Create a File object from the buffer for the Groq SDK
    const audioFile = new File([audioBuffer], 'recording.webm', {
      type: 'audio/webm',
    });

    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-large-v3',
      language: 'es', // Spanish — matches user's primary language
    });

    const transcript = (transcription.text ?? '').trim();

    if (transcript.length === 0) {
      return response.status(422).json({ error: 'The recording could not be transcribed. It may be too short or unclear.' });
    }

    return response.status(200).json({ transcript });
  } catch (error) {
    console.error('Transcription error:', error instanceof Error ? error.message : 'Unknown error');
    return response.status(500).json({ error: 'Transcription failed. Please try again.' });
  }
}

function extractFileFromMultipart(body: Buffer, boundary: string): Buffer | null {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const bodyStr = body.toString('binary');
  const parts = bodyStr.split(`--${boundary}`);

  for (const part of parts) {
    // Look for the audio file part (Content-Disposition with filename)
    if (part.includes('Content-Disposition') && part.includes('filename')) {
      // Find the empty line that separates headers from body
      const headerEndIndex = part.indexOf('\r\n\r\n');

      if (headerEndIndex === -1) continue;

      const fileContent = part.slice(headerEndIndex + 4);
      // Remove trailing boundary markers
      const cleanContent = fileContent.replace(/\r\n--$/, '').replace(/\r\n$/, '');

      return Buffer.from(cleanContent, 'binary');
    }
  }

  return null;
}
