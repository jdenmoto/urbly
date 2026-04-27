import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const functions = getFunctions(app);

const shouldUseEmulators = import.meta.env.VITE_USE_EMULATORS === 'true';
const functionsFlag = '__URBLY_FUNCTIONS_EMULATOR_CONNECTED__';
const globalScope = globalThis as typeof globalThis & { [functionsFlag]?: boolean };

if (shouldUseEmulators && !globalScope[functionsFlag]) {
  connectFunctionsEmulator(functions, 'localhost', 5001);
  globalScope[functionsFlag] = true;
}
