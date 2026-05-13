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

  it('permite leer membresía propia cuando el usuario pertenece al account activo', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/member-user').set({
        role: 'operator',
        permissions: ['service_orders.read'],
      });
    });

    const memberDb = testEnv!
      .authenticatedContext('member-user', { activeAccountId: 'account-a', role: 'operator' })
      .firestore();

    await assertSucceeds(memberDb.doc('accounts/account-a/members/member-user').get());
  });

  it('bloquea lectura de membresía si el usuario no pertenece al account activo', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/member-user').set({
        role: 'operator',
        permissions: ['service_orders.read'],
      });
    });

    const nonMemberDb = testEnv!
      .authenticatedContext('other-user', { activeAccountId: 'account-a', role: 'operator' })
      .firestore();
    const inactiveAccountDb = testEnv!
      .authenticatedContext('member-user', { activeAccountId: 'account-b', role: 'operator' })
      .firestore();

    await assertFails(nonMemberDb.doc('accounts/account-a/members/member-user').get());
    await assertFails(inactiveAccountDb.doc('accounts/account-a/members/member-user').get());
  });

  it('permite a admin del account activo leer otra membresía del mismo account', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/admin-user').set({
        role: 'admin',
        permissions: [],
      });
      await context.firestore().doc('accounts/account-a/members/member-user').set({
        role: 'operator',
        permissions: ['service_orders.read'],
      });
    });

    const accountAdminDb = testEnv!
      .authenticatedContext('admin-user', { activeAccountId: 'account-a', role: 'admin' })
      .firestore();

    await assertSucceeds(accountAdminDb.doc('accounts/account-a/members/member-user').get());
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
