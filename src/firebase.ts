import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const env = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-firebase-api-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId: env.VITE_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000'
};

export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Enforce browser local persistence
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Auth] Persistence error:', err);
});

export function getFriendlyErrorMessage(err: any): string {
  const code = err?.code || '';
  const message = err?.message || String(err);

  switch (code) {
    case 'permission-denied':
      return 'Action not permitted. Please check if you are logged in with the correct permissions.';
    case 'unavailable':
      return 'Network is currently offline or unreachable. Please check your internet connection and try again.';
    case 'not-found':
      return 'Requested order or item was not found.';
    case 'auth/invalid-email':
      return 'The email format is invalid. Please check your spelling.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please check your details or sign up.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your credentials and try again.';
    case 'auth/network-request-failed':
      return 'Network connection error. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access temporarily blocked for security. Please try again in a few minutes.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please login instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters long.';
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
}
