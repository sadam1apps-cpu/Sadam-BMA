import {initializeApp, getApps, getApp} from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {getAuth, GoogleAuthProvider} from 'firebase/auth';
import {getStorage} from 'firebase/storage';

const firebaseConfig = {
  projectId: 'gen-lang-client-0889196823',
  appId: '1:188511733207:web:6879f05305083ff1af7792',
  apiKey: 'AIzaSyCeetJKv4lUli1j7llv1uijJrvrPixqbqQ',
  authDomain: 'gen-lang-client-0889196823.firebaseapp.com',
  storageBucket: 'gen-lang-client-0889196823.firebasestorage.app',
  messagingSenderId: '188511733207',
  oAuthClientId:
    '188511733207-9eri6jt7dcnk230igqdcql5uji5j7b50.apps.googleusercontent.com',
};

const FIRESTORE_DATABASE_ID =
  'ai-studio-businessmanageme-3137eddd-7c50-4bbd-af00-6af6f4f99d3c';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app, FIRESTORE_DATABASE_ID);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Health check: writes + reads a heartbeat doc.
 * Returns true if Firestore is reachable.
 */
export async function testConnection(): Promise<boolean> {
  try {
    const testRef = doc(db, 'test', 'health');
    await setDoc(
      testRef,
      {lastCheck: new Date().toISOString(), ping: serverTimestamp()},
      {merge: true},
    );
    const snap = await getDoc(testRef);
    return snap.exists();
  } catch (e) {
    console.error('[firebase] testConnection failed:', e);
    return false;
  }
}

export default app;