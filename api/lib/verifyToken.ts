import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return;
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
    ) as ServiceAccount;

    initializeApp({ credential: cert(serviceAccount) });
  } else {
    initializeApp({
      projectId: 'trainlog-e6ed0',
    });
  }
}

export async function verifyFirebaseToken(
  token: string,
): Promise<DecodedIdToken | null> {
  try {
    initializeFirebaseAdmin();
    const decodedToken = await getAuth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {

      'Token verification failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    return null;
  }
}
