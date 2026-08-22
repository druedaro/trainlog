import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

export function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (serviceAccountBase64) {
    const serviceAccount = JSON.parse(
      Buffer.from(serviceAccountBase64, 'base64').toString('utf-8'),
    ) as ServiceAccount;

    return initializeApp({ credential: cert(serviceAccount) });
  } else {
    return initializeApp({
      projectId: 'trainlog-e6ed0',
    });
  }
}

const adminApp = initializeFirebaseAdmin();
const adminAuth = getAuth(adminApp);
const adminDb = getFirestore(adminApp);
const adminMessaging = getMessaging(adminApp);

export { adminApp, adminAuth, adminDb, adminMessaging };
