/**
 * 🚀 Google Firebase Client SDK Initialization
 * Project: bhsedu-e0906 (Smart School Management System)
 */

import { initializeApp, getApps, getApp, setLogLevel, onLog, FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const EXPECTED_OFFLINE_LOG_PATTERNS = [
  'Could not reach Cloud Firestore backend',
  'The client will operate in offline mode',
  'Failed to get document because the client is offline',
  'client is offline',
];

/**
 * Route expected Firestore offline-fallback notices to `console.warn` instead of
 * `console.error` so Next.js dev mode does not raise a blocking Error Overlay when
 * the user's network is disconnected or slow, while preserving all real errors.
 */
function configureFirebaseLogging(): void {
  setLogLevel('silent');
  onLog(
    ({ level, message, type }) => {
      const isExpectedOffline = EXPECTED_OFFLINE_LOG_PATTERNS.some((p) =>
        message.includes(p)
      );
      if (isExpectedOffline) {
        console.warn(`[${type}] (Offline Mode): ${message}`);
        return;
      }
      if (level === 'error') {
        console.error(`[${type}] ${message}`);
      } else if (level === 'warn') {
        console.warn(`[${type}] ${message}`);
      }
    },
    { level: 'warn' }
  );
}

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAezcd-uTdee0jfTqMVKiwJuTcDvel-zUs",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "bhsedu-e0906.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "bhsedu-e0906",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "bhsedu-e0906.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "633292956403",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:633292956403:web:1422729e7d1895a8b60d86",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-B7FRH0HWQG"
};

export const FIREBASE_VAPID_KEY = 
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 
  "BAYtfWauVBDI_va8v9cRCFnXLIO4eKRBlCEEeBUUt1GdMoEanmOfLKnUsD80tMm8yhymeNbiA7cgcHkgnLYzUh0";

// Safe Singleton Firebase Initialization
let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

try {
  if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'test') {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    configureFirebaseLogging();

    if (typeof window !== 'undefined') {
      // Browser: enable IndexedDB multi-tab cache + force long-polling so WebChannel
      // streaming never hangs behind ISPs, firewalls, or stalled IPv6 routes.
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
          experimentalForceLongPolling: true,
        });
      } catch {
        try {
          db = initializeFirestore(app, { experimentalForceLongPolling: true });
        } catch {
          db = getFirestore(app);
        }
      }
    } else {
      // SSR / Node.js: avoid browser-only long-polling and IndexedDB cache options.
      db = getFirestore(app);
    }

    auth = getAuth(app);
    storage = getStorage(app);
  }
} catch (err) {
  console.warn('[Firebase] Initialized with fallback or deferred mode:', err);
}

export { app, db, auth, storage };

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
};
