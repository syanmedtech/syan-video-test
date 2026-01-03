
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from './firebase';

export const seedFirestore = async () => {
  if (!isFirebaseConfigured()) return;
  if (sessionStorage.getItem('syan_fs_seeded')) return;

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    // TASK 1: Ensure appConfig/player exists
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
        updatedBy: currentUser.uid
      });
    }

    // TASK 2: Boostrap Super Admin if email matches
    if (currentUser.email === 'syanmedtechadmen@gmail.com') {
      const adminRef = doc(db, 'admins', currentUser.uid);
      const adminSnap = await getDoc(adminRef);
      if (!adminSnap.exists()) {
        await setDoc(adminRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          role: 'super_admin',
          createdAt: serverTimestamp()
        });
      }
    }

    sessionStorage.setItem('syan_fs_seeded', 'true');
  } catch (error) {
    console.error('Syan Seeder Error:', error);
  }
};
