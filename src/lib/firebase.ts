import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyARBQ8jyOFW-Ev5Se6XMITvrAI1P-Q5mzw',
  authDomain: 'trainlog-e6ed0.firebaseapp.com',
  projectId: 'trainlog-e6ed0',
  storageBucket: 'trainlog-e6ed0.firebasestorage.app',
  messagingSenderId: '695738818600',
  appId: '1:695738818600:web:f6938dc3143dfc0b66151d',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
