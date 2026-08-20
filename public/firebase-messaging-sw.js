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
  
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
