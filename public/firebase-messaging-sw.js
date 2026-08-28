importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyARBQ8jyOFW-Ev5Se6XMITvrAI1P-Q5mzw',
  authDomain: 'trainlog-e6ed0.firebaseapp.com',
  projectId: 'trainlog-e6ed0',
  storageBucket: 'trainlog-e6ed0.firebasestorage.app',
  messagingSenderId: '695738818600',
  appId: '1:695738818600:web:f6938dc3143dfc0b66151d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = self.location.origin + '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Find any window/app instance that belongs to our app's origin
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          // If they were on another page (e.g. /profile), we can choose to navigate them to home
          // or just focus the app where they left off. Focus is usually best.
          return client.focus();
        }
      }
      // If the app is fully closed, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
