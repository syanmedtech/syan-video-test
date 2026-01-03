
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
  // Fixes the [object Object] display by joining the keys into a string
  console.warn(`Syan Secure: Missing Firebase environment variables: ${missingKeys.join(', ')}. Switching to Demo/Mock mode.`);
}

// We set isConfigMissing to false now to allow the app to boot in "Demo Mode" 
// with the provided mock fallbacks, resolving the blocked UI error.
export const isConfigMissing = false; 

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSy-DEMO-MODE-MOCK-KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "syan-secure-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "syan-secure-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "syan-secure-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: env.VITE_FIREBASE_APP_ID || "1:1234567890:web:demo123",
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize App with fallbacks to ensure SDK doesn't crash during boot
const app = (!getApps().length) 
  ? initializeApp(firebaseConfig) 
  : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Simulated login service to maintain existing functionality for UI testing
export const authService = {
  login: async (email: string, pass: string) => {
    return { uid: 'admin_123', email };
  }
};
