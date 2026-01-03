
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Use environment variables for flexible configuration across Test and Production
export const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSy-MOCK-KEY",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "syan-secure.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "syan-secure",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "syan-secure.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:123456:web:abcd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Keep simulated login for backward compatibility with the current login page
export const authService = {
  login: async (email: string, pass: string) => {
    return { uid: 'admin_123', email };
  }
};
