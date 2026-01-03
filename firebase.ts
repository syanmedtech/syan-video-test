
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const env = (import.meta as any).env || {};

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

export const missingKeys = requiredKeys.filter(key => !env[key]);

/**
 * Returns true if all mandatory Firebase environment variables are present.
 */
export const isFirebaseConfigured = (): boolean => missingKeys.length === 0;

export const isConfigMissing = !isFirebaseConfigured();

// Use environment variables if present, otherwise use stable mock strings for Demo Mode
export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSy-DEMO-MODE-MOCK-KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "syan-secure-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "syan-secure-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "syan-secure-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: env.VITE_FIREBASE_APP_ID || "1:1234567890:web:demo123",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize App safely even in Demo Mode
const app = (!getApps().length) 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const authService = {
  login: async (email: string, pass: string) => {
    // In demo mode, we simulate success for the specific credentials
    if (!isFirebaseConfigured()) {
       if (email === 'syanmedtechadmen@gmail.com' && pass === 'Admin@1234') {
         return { uid: 'admin_123', email };
       }
       throw new Error('Invalid credentials (Demo Mode)');
    }
    // In production, this should ideally use Firebase Auth (implementation detail for user to add)
    return { uid: 'admin_123', email };
  }
};
