
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

const missingKeys = requiredKeys.filter(key => !env[key]);

if (missingKeys.length > 0) {
  console.error('Configuration missing: Firebase environment variables are not set.', { missingKeys });
}

export const isConfigMissing = missingKeys.length > 0;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// Only initialize if we have the minimum requirements to prevent SDK errors
const app = (!getApps().length && !isConfigMissing) 
  ? initializeApp(firebaseConfig) 
  : (getApps().length ? getApp() : null);

export const auth = app ? getAuth(app) : {} as any;
export const db = app ? getFirestore(app) : {} as any;
export const storage = app ? getStorage(app) : {} as any;

// Simulated login service to maintain existing functionality for UI testing
export const authService = {
  login: async (email: string, pass: string) => {
    return { uid: 'admin_123', email };
  }
};
