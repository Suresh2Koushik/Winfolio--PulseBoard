import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length > 0) {
  throw new Error(`Missing Firebase configuration: ${missing.join(', ')}. Copy .env.example to .env and fill it in.`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const useEmulators = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS === 'true';

// App Check proves requests come from this app, not a script reusing the public config.
// It is on only when a reCAPTCHA v3 site key is configured (see README > App Check).
const appCheckKey = import.meta.env.VITE_APPCHECK_SITE_KEY;
if (appCheckKey && !useEmulators) {
  if (import.meta.env.DEV) {
    // Local dev prints a debug token to the console; register it in the Firebase console.
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(appCheckKey),
    isTokenAutoRefreshEnabled: true,
  });
}

// Initialize services
export const auth = getAuth(app);
// Optional form fields arrive as `undefined`; drop them instead of failing the write.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true });
export const storage = getStorage(app);

// Connect to emulators in development (ports match firebase.json)
if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8085);
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

export default app;
