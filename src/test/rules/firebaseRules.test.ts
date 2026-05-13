import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'demo-urbly-rules';
const storageBucket = `${projectId}.appspot.com`;
const describeWithEmulators = process.env.FIREBASE_EMULATOR_HUB ? describe : describe.skip;

let testEnv: RulesTestEnvironment | undefined;

async function readRulesFile(fileName: string) {
  return readFile(resolve(process.cwd(), fileName), 'utf8');
}

describeWithEmulators('Firebase Rules harness', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: await readRulesFile('firestore.rules'),
      },
      storage: {
        rules: await readRulesFile('storage.rules'),
      },
    });
  });

  afterEach(async () => {
    await testEnv?.clearFirestore();
    await testEnv?.clearStorage();
  });

  afterAll(async () => {
    await testEnv?.cleanup();
  });

  it('carga las reglas actuales de Firestore y bloquea lectura anónima', async () => {
    const unauthenticatedDb = testEnv!.unauthenticatedContext().firestore();

    await assertFails(unauthenticatedDb.doc('feature_flags/bootstrap').get());
  });

  it('permite lectura básica de Firestore a un rol staff autenticado', async () => {
    const adminDb = testEnv!.authenticatedContext('admin-user', { role: 'admin' }).firestore();

    await assertSucceeds(adminDb.doc('feature_flags/bootstrap').get());
  });

  it('carga las reglas actuales de Storage y permite subir imagen a staff', async () => {
    const adminStorage = testEnv!
      .authenticatedContext('admin-user', { role: 'admin' })
      .storage(`gs://${storageBucket}`);

    const uploadTask = adminStorage
      .ref('service-orders/order-1/attachments/photo.png')
      .putString('placeholder-image', 'raw', { contentType: 'image/png' });

    const uploadResult = await assertSucceeds(uploadTask.then((snapshot) => snapshot));

    expect(uploadResult.metadata.contentType).toBe('image/png');
  });
});
