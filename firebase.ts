
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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
export const isFirebaseConfigured = (): boolean => missingKeys.length === 0;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSy-DEMO-MODE-MOCK-KEY",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "syan-secure-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "syan-secure-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "syan-secure-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: env.VITE_FIREBASE_APP_ID || "1:1234567890:web:demo123"
};

const app = (!getApps().length) ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Role & Profile Sync Logic
export const syncUserProfile = async (user: any) => {
  if (!isFirebaseConfigured()) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email,
      emailLower: user.email.toLowerCase(),
      role: 'user',
      status: 'active',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    });
  } else {
    await updateDoc(userRef, { lastLogin: serverTimestamp() });
  }

  // Auto Super Admin Bootstrap
  if (user.email === 'syanmedtechadmen@gmail.com') {
    const adminRef = doc(db, 'admins', user.uid);
    const adminSnap = await getDoc(adminRef);
    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        uid: user.uid,
        email: user.email,
        role: 'super_admin',
        createdAt: serverTimestamp()
      });
    }
  }
};

export const authService = {
  login: async (email: string, pass: string) => {
    if (!isFirebaseConfigured()) {
       if (email === 'syanmedtechadmen@gmail.com' && pass === 'Admin@1234') {
         return { uid: 'admin_123', email };
       }
       throw new Error('Invalid credentials (Demo Mode)');
    }
    const res = await signInWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(res.user);
    return res.user;
  },
  signup: async (email: string, pass: string) => {
    if (!isFirebaseConfigured()) throw new Error('Signup disabled in Demo Mode');
    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await syncUserProfile(res.user);
    return res.user;
  },
  logout: () => signOut(auth)
};
