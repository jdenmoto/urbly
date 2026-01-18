import { getFunctions } from 'firebase/functions';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const functions = getFunctions(app);
