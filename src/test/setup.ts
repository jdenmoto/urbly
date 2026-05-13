import { vi } from 'vitest';

vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'urbly-test');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'urbly-test.appspot.com');
vi.stubEnv('VITE_USE_EMULATORS', 'false');
