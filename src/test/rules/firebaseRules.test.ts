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


  it('permite leer service_orders a roles operativos dentro del account activo', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/operator-user').set({
        role: 'operator',
        permissions: [],
      });
      await context.firestore().doc('service_orders/order-1').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        status: 'scheduled',
      });
    });

    const operatorDb = testEnv!
      .authenticatedContext('operator-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();

    await assertSucceeds(operatorDb.doc('service_orders/order-1').get());
  });

  it('bloquea service_orders si el account activo no corresponde', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/operator-user').set({
        role: 'operator',
        permissions: [],
      });
      await context.firestore().doc('service_orders/order-1').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        status: 'scheduled',
      });
    });

    const wrongAccountDb = testEnv!
      .authenticatedContext('operator-user', { activeAccountId: 'account-b', role: 'custom' })
      .firestore();

    await assertFails(wrongAccountDb.doc('service_orders/order-1').get());
  });

  it('permite leer service_orders al técnico asignado por uid o empleado vinculado por email', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/tech-user').set({
        role: 'technician',
        permissions: [],
      });
      await context.firestore().doc('accounts/account-a/members/linked-tech-user').set({
        role: 'technician',
        permissions: [],
      });
      await context.firestore().doc('employees/employee-1').set({
        email: 'linked-tech@urbly.local',
      });
      await context.firestore().doc('service_orders/order-by-uid').set({
        accountId: 'account-a',
        assignedTechnicianId: 'tech-user',
        buildingId: 'building-1',
        status: 'scheduled',
      });
      await context.firestore().doc('service_orders/order-by-employee').set({
        accountId: 'account-a',
        assignedTechnicianId: 'employee-1',
        buildingId: 'building-1',
        status: 'scheduled',
      });
    });

    const techDb = testEnv!
      .authenticatedContext('tech-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();
    const linkedTechDb = testEnv!
      .authenticatedContext('linked-tech-user', { activeAccountId: 'account-a', role: 'custom', email: 'linked-tech@urbly.local' })
      .firestore();

    await assertSucceeds(techDb.doc('service_orders/order-by-uid').get());
    await assertSucceeds(linkedTechDb.doc('service_orders/order-by-employee').get());
  });

  it('bloquea service_orders a técnicos no asignados y view de account por limitación de proyección de campos', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/other-tech-user').set({
        role: 'technician',
        permissions: [],
      });
      await context.firestore().doc('accounts/account-a/members/view-user').set({
        role: 'view',
        permissions: [],
      });
      await context.firestore().doc('service_orders/order-1').set({
        accountId: 'account-a',
        assignedTechnicianId: 'tech-user',
        buildingId: 'building-1',
        attachments: ['evidence.png'],
        status: 'scheduled',
      });
    });

    const otherTechDb = testEnv!
      .authenticatedContext('other-tech-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();
    const viewDb = testEnv!
      .authenticatedContext('view-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();

    await assertFails(otherTechDb.doc('service_orders/order-1').get());
    await assertFails(viewDb.doc('service_orders/order-1').get());
  });

  it('permite leer service_orders a client/building_admin relacionados por customer o administración', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/client-user').set({
        role: 'client',
        customerId: 'customer-1',
      });
      await context.firestore().doc('accounts/account-a/members/building-admin-user').set({
        role: 'building_admin',
        administrationId: 'mgmt-1',
      });
      await context.firestore().doc('buildings/building-1').set({
        accountId: 'account-a',
        managementCompanyId: 'mgmt-1',
      });
      await context.firestore().doc('service_orders/order-by-customer').set({
        accountId: 'account-a',
        customerId: 'customer-1',
        buildingId: 'building-2',
        status: 'scheduled',
      });
      await context.firestore().doc('service_orders/order-by-building').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        managementCompanyId: 'mgmt-1',
        status: 'scheduled',
      });
    });

    const clientDb = testEnv!
      .authenticatedContext('client-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();
    const buildingAdminDb = testEnv!
      .authenticatedContext('building-admin-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();

    await assertSucceeds(clientDb.doc('service_orders/order-by-customer').get());
    await assertSucceeds(buildingAdminDb.doc('service_orders/order-by-building').get());
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
