import { getToken, onMessage } from 'firebase/messaging';
import { messaging, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

// @ts-ignore
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestPushPermissions(userId: string): Promise<boolean> {
  if (!messaging) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await saveFCMToken(userId, token);
        return true;
      }
    }
    return false;
  } catch (error) {
    
    return false;
  }
}

async function saveFCMToken(userId: string, token: string) {
  try {
    const tokenDoc = doc(db, 'users', userId, 'fcmTokens', token);
    await setDoc(tokenDoc, {
      token,
      device: navigator.userAgent,
      updatedAt: Date.now()
    });
  } catch (err) {
    
  }
}

export function setupMessageListener() {
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {

    if (payload.notification) {

      const title = payload.notification.title;
      const options = {
        body: payload.notification.body,
        icon: '/icon-192.png'
      };

      if (Notification.permission === 'granted') {
         new Notification(title || 'Trainlog', options);
      }
    }
  });
}
