import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance, db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestPushPermissions(userId: string): Promise<boolean> {
  try {
    const messaging = await getMessagingInstance();
    if (!messaging) return false;

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token) {
        await saveFCMToken(userId, token);
        return true;
      }
    }
    return false;
  } catch (error: any) {
    if (error?.name === 'AbortError' || error?.message?.includes('push service error')) {
      console.warn('Notificaciones push no soportadas o bloqueadas en este navegador.');
    } else {
      console.error('Error requesting push permission:', error);
    }
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
    console.error('Error saving FCM token:', err);
  }
}

export async function setupMessageListener() {
  const messaging = await getMessagingInstance();
  if (!messaging) return;
  
  onMessage(messaging, (payload) => {

    if (payload.notification) {

      const title = payload.notification.title;
      const options = {
        body: payload.notification.body,
        icon: '/icon-192.png'
      };

      if (Notification.permission === 'granted') {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title || 'Trainlog', options);
          }).catch(() => {
            new Notification(title || 'Trainlog', options);
          });
        } else {
          new Notification(title || 'Trainlog', options);
        }
      }
    }
  });
}
