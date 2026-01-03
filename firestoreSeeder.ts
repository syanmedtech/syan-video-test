
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Silent Background Auto-Seeder
 * Ensures required Firestore collections/documents exist without manual intervention.
 * Runs once per session upon admin dashboard access.
 */
export const seedFirestore = async () => {
  // 1. Session check: Ensure this logic runs only ONCE per session
  if (sessionStorage.getItem('syan_fs_seeded')) return;

  // 2. Identify current logged-in user
  // We check Firebase Auth first, then fallback to the app's internal mock storage if needed
  const currentUser = auth.currentUser;
  const storedAuth = localStorage.getItem('admin_auth');
  const adminData = storedAuth ? JSON.parse(storedAuth) : null;

  const uid = currentUser?.uid || 'admin_123';
  const email = currentUser?.email || adminData?.email;

  // Seeding only occurs if an admin is recognized
  if (!email) return;

  try {
    // TASK 1: Ensure appConfig/player exists with requested defaults
    const playerRef = doc(db, 'appConfig', 'player');
    const playerSnap = await getDoc(playerRef);
    
    if (!playerSnap.exists()) {
      await setDoc(playerRef, {
        watermarkStoragePath: null,
        watermarkOpacity: 0.25,
        logoStoragePath: null,
        logoOpacity: 0.6,
        securityWatermarkEnabled: true,
        blinkDurationMs: 2000,
        blinkIntervalSeconds: 5,
        blockSpeed: false,
        blockPause: false,
        blockForward10: false,
        createdAt: serverTimestamp(),
        updatedBy: uid
      });
      console.debug('Syan Seeder: Initialized global player config.');
    }

    // TASK 2: Ensure admins/{uid} exists with proper role
    const adminRef = doc(db, 'admins', uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      // Super Admin logic based on requested email
      const isSuperAdmin = email === 'syanmedtechadmen@gmail.com';
      await setDoc(adminRef, {
        uid: uid,
        email: email,
        role: isSuperAdmin ? 'super_admin' : 'admin',
        createdAt: serverTimestamp(),
        autoSeeded: true
      });
      console.debug(`Syan Seeder: Created admin record for ${email} with role ${isSuperAdmin ? 'super_admin' : 'admin'}.`);
    }

    // Mark as seeded for this session to prevent redundant calls
    sessionStorage.setItem('syan_fs_seeded', 'true');
  } catch (error) {
    // Fail silently in UI as per requirements, but log for developer debugging
    console.error('Syan Seeder Error:', error);
  }
};
