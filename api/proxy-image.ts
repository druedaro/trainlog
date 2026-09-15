import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  const { url } = request.query;

  if (!url || typeof url !== 'string') {
    return response.status(400).json({ error: 'Missing or invalid url parameter' });
  }

  try {
    const fetchResponse = await fetch(url, {
      headers: {
        'User-Agent': 'Trainlog Proxy',
      },
    });

    if (!fetchResponse.ok) {
      return response.status(fetchResponse.status).send('Failed to fetch image');
    }

    const contentType = fetchResponse.headers.get('content-type');
    if (contentType) {
      response.setHeader('Content-Type', contentType);
    }
    
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

    const buffer = await fetchResponse.arrayBuffer();
    return response.status(200).send(Buffer.from(buffer));
  } catch (error) {
    console.error('Proxy image error:', error);
    return response.status(500).json({ error: 'Failed to proxy image' });
  }
}
