import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from './firebaseAdmin';

export async function verifyFirebaseToken(
  token: string,
): Promise<DecodedIdToken | null> {
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
}
