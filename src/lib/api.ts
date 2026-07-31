import { auth } from '@/lib/firebase';

const API_BASE_URL = '/api';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;

  if (!user) {
    throw new ApiError('You must be signed in to perform this action.', 401);
  }

  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const headers = await getAuthHeaders();
  const formData = new FormData();
  formData.append('audio', audioBlob);

  const response = await fetch(`${API_BASE_URL}/transcribeAudio`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(
      `Transcription failed: ${errorText}`,
      response.status,
    );
  }

  const data = (await response.json()) as { transcript: string };

  if (!data.transcript || data.transcript.trim().length === 0) {
    throw new ApiError(
      'The recording could not be transcribed. It may have been too short or unclear.',
      422,
    );
  }

  return data.transcript;
}

export async function analyzeReflection(
  transcript: string,
): Promise<unknown> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/analyzeReflection`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ transcript }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new ApiError(
      `Analysis failed: ${errorText}`,
      response.status,
    );
  }

  return response.json();
}

export { ApiError };
