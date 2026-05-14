import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

const projectId = 'demo-urbly-rules';
const storageBucket = `${projectId}.appspot.com`;
const describeWithEmulators = process.env.FIREBASE_EMULATOR_HUB ? describe : describe.skip;

let testEnv: RulesTestEnvironment | undefined;

async function readRulesFile(fileName: string) {
  return readFile(resolve(process.cwd(), fileName), 'utf8');
}

function serviceOrder(overrides: Record<string, unknown> = {}) {
  return {
    accountId: 'account-a',
    buildingId: 'building-1',
    title: 'Lavado de tanque',
    type: 'maintenance',
    priority: 'medium',
    status: 'scheduled',
    scheduledStartAt: '2026-05-14T08:00:00.000Z',
    scheduledEndAt: '2026-05-14T10:00:00.000Z',
    ...overrides
  };
}

async function seedAccountMember(uid: string, role: string, extra: Record<string, unknown> = {}) {
  await testEnv!.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
    await context
      .firestore()
      .doc(`accounts/account-a/members/${uid}`)
      .set({
        role,
        permissions: [],
        ...extra
      });
  });
}

function accountDb(uid: string) {
  return testEnv!
    .authenticatedContext(uid, { activeAccountId: 'account-a', role: 'custom' })
    .firestore();
}

function accountStorage(uid: string) {
  return testEnv!
    .authenticatedContext(uid, { activeAccountId: 'account-a', role: 'custom' })
    .storage(`gs://${storageBucket}`);
}

async function seedServiceOrderEvidence(
  serviceOrderId: string,
  serviceOrderData: Record<string, unknown> = {},
  filePath = `service-orders/${serviceOrderId}/attachments/existing.png`
) {
  await testEnv!.withSecurityRulesDisabled(async (context) => {
    await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
    await context.firestore().doc(`service_orders/${serviceOrderId}`).set(serviceOrder(serviceOrderData));
    await context
      .storage(`gs://${storageBucket}`)
      .ref(filePath)
      .putString('existing-image', 'raw', { contentType: 'image/png' });
  });
}

describeWithEmulators('Firebase Rules harness', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: await readRulesFile('firestore.rules')
      },
      storage: {
        rules: await readRulesFile('storage.rules')
      }
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
      await context
        .firestore()
        .doc('accounts/account-a/members/member-user')
        .set({
          role: 'operator',
          permissions: ['service_orders.read']
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
      await context
        .firestore()
        .doc('accounts/account-a/members/member-user')
        .set({
          role: 'operator',
          permissions: ['service_orders.read']
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
        permissions: []
      });
      await context
        .firestore()
        .doc('accounts/account-a/members/member-user')
        .set({
          role: 'operator',
          permissions: ['service_orders.read']
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
        permissions: []
      });
      await context.firestore().doc('service_orders/order-1').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        status: 'scheduled'
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
        permissions: []
      });
      await context.firestore().doc('service_orders/order-1').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        status: 'scheduled'
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
        permissions: []
      });
      await context.firestore().doc('accounts/account-a/members/linked-tech-user').set({
        role: 'technician',
        permissions: []
      });
      await context.firestore().doc('employees/employee-1').set({
        email: 'linked-tech@urbly.local'
      });
      await context.firestore().doc('service_orders/order-by-uid').set({
        accountId: 'account-a',
        assignedTechnicianId: 'tech-user',
        buildingId: 'building-1',
        status: 'scheduled'
      });
      await context.firestore().doc('service_orders/order-by-employee').set({
        accountId: 'account-a',
        assignedTechnicianId: 'employee-1',
        buildingId: 'building-1',
        status: 'scheduled'
      });
    });

    const techDb = testEnv!
      .authenticatedContext('tech-user', { activeAccountId: 'account-a', role: 'custom' })
      .firestore();
    const linkedTechDb = testEnv!
      .authenticatedContext('linked-tech-user', {
        activeAccountId: 'account-a',
        role: 'custom',
        email: 'linked-tech@urbly.local'
      })
      .firestore();

    await assertSucceeds(techDb.doc('service_orders/order-by-uid').get());
    await assertSucceeds(linkedTechDb.doc('service_orders/order-by-employee').get());
  });

  it('bloquea service_orders a técnicos no asignados y view de account por limitación de proyección de campos', async () => {
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc('accounts/account-a').set({ name: 'Account A' });
      await context.firestore().doc('accounts/account-a/members/other-tech-user').set({
        role: 'technician',
        permissions: []
      });
      await context.firestore().doc('accounts/account-a/members/view-user').set({
        role: 'view',
        permissions: []
      });
      await context
        .firestore()
        .doc('service_orders/order-1')
        .set({
          accountId: 'account-a',
          assignedTechnicianId: 'tech-user',
          buildingId: 'building-1',
          attachments: ['evidence.png'],
          status: 'scheduled'
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
        customerId: 'customer-1'
      });
      await context.firestore().doc('accounts/account-a/members/building-admin-user').set({
        role: 'building_admin',
        administrationId: 'mgmt-1'
      });
      await context.firestore().doc('buildings/building-1').set({
        accountId: 'account-a',
        managementCompanyId: 'mgmt-1'
      });
      await context.firestore().doc('service_orders/order-by-customer').set({
        accountId: 'account-a',
        customerId: 'customer-1',
        buildingId: 'building-2',
        status: 'scheduled'
      });
      await context.firestore().doc('service_orders/order-by-building').set({
        accountId: 'account-a',
        buildingId: 'building-1',
        managementCompanyId: 'mgmt-1',
        status: 'scheduled'
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

  it('permite a scheduler crear/agendar, asignar y reprogramar sin cerrar service_orders', async () => {
    await seedAccountMember('scheduler-user', 'scheduler');
    const schedulerDb = accountDb('scheduler-user');

    await assertSucceeds(
      schedulerDb
        .doc('service_orders/order-scheduler')
        .set(serviceOrder({ assignedTechnicianId: 'tech-1' }))
    );
    await assertSucceeds(
      schedulerDb.doc('service_orders/order-scheduler').update({
        assignedTechnicianId: 'tech-2',
        scheduledStartAt: '2026-05-15T08:00:00.000Z',
        scheduledEndAt: '2026-05-15T10:00:00.000Z',
        status: 'scheduled',
        updatedAt: '2026-05-13T22:00:00.000Z'
      })
    );
    await assertFails(
      schedulerDb.doc('service_orders/order-scheduler').update({
        status: 'completed',
        completedAt: '2026-05-15T10:00:00.000Z',
        updatedAt: '2026-05-15T10:00:00.000Z'
      })
    );
  });

  it('bloquea create de service_orders sin campos mínimos o con accountId ajeno', async () => {
    await seedAccountMember('admin-user', 'admin');
    const adminDb = accountDb('admin-user');
    const wrongAccountDb = testEnv!
      .authenticatedContext('admin-user', { activeAccountId: 'account-b', role: 'custom' })
      .firestore();

    await assertFails(
      adminDb
        .doc('service_orders/missing-fields')
        .set({ accountId: 'account-a', status: 'scheduled' })
    );
    await assertFails(wrongAccountDb.doc('service_orders/wrong-account').set(serviceOrder()));
  });

  it('bloquea escrituras legacy de admin/editor sin membership tenant-aware en service_orders', async () => {
    const legacyAdminDb = testEnv!
      .authenticatedContext('legacy-admin', { role: 'admin' })
      .firestore();

    await assertFails(legacyAdminDb.doc('service_orders/legacy-admin-create').set(serviceOrder()));
  });

  it('permite a operator cerrar service_orders dentro del account pero no reabrir ni reasignar', async () => {
    await seedAccountMember('operator-user', 'operator');
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc('service_orders/order-to-close')
        .set(serviceOrder({ status: 'in_progress' }));
    });

    const operatorDb = accountDb('operator-user');

    await assertSucceeds(
      operatorDb.doc('service_orders/order-to-close').update({
        status: 'completed',
        completedAt: '2026-05-15T10:00:00.000Z',
        completionPhotos: ['gs://photo-1'],
        report: { observations: 'Servicio finalizado' },
        updatedAt: '2026-05-15T10:00:00.000Z'
      })
    );
    await assertFails(
      operatorDb.doc('service_orders/order-to-close').update({ status: 'in_progress' })
    );
    await assertFails(
      operatorDb.doc('service_orders/order-to-close').update({ assignedTechnicianId: 'tech-2' })
    );
  });

  it('permite al técnico asignado actualizar solo progreso, evidencias e incidencias', async () => {
    await seedAccountMember('tech-user', 'technician');
    await seedAccountMember('other-tech-user', 'technician');
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc('service_orders/order-tech')
        .set(serviceOrder({ assignedTechnicianId: 'tech-user' }));
    });

    const techDb = accountDb('tech-user');
    const otherTechDb = accountDb('other-tech-user');

    await assertSucceeds(
      techDb.doc('service_orders/order-tech').update({
        status: 'in_progress',
        startedAt: '2026-05-15T08:00:00.000Z',
        attachments: ['gs://evidence-1'],
        issues: [{ id: 'issue-1', type: 'leak', category: 'technical', photos: [] }],
        updatedAt: '2026-05-15T08:00:00.000Z'
      })
    );
    await assertFails(
      techDb.doc('service_orders/order-tech').update({ assignedTechnicianId: 'tech-2' })
    );
    await assertFails(techDb.doc('service_orders/order-tech').update({ status: 'completed' }));
    await assertFails(
      otherTechDb.doc('service_orders/order-tech').update({ status: 'in_progress' })
    );
  });

  it('permite owner/admin/editor/supervisor editar y reabrir service_orders; view/auditoria no escriben', async () => {
    const privilegedRoles = ['owner', 'admin', 'editor', 'supervisor'];
    for (const role of privilegedRoles) {
      await seedAccountMember(`${role}-user`, role);
    }
    await seedAccountMember('view-user', 'view');
    await seedAccountMember('auditor-user', 'auditoria');
    await testEnv!.withSecurityRulesDisabled(async (context) => {
      for (const role of privilegedRoles) {
        await context
          .firestore()
          .doc(`service_orders/order-reopen-${role}`)
          .set(
            serviceOrder({
              status: 'completed',
              completedAt: '2026-05-15T10:00:00.000Z'
            })
          );
      }
    });

    for (const role of privilegedRoles) {
      const privilegedDb = accountDb(`${role}-user`);
      await assertSucceeds(
        privilegedDb.doc(`service_orders/order-reopen-${role}`).update({
          status: 'in_progress',
          completedAt: null,
          updatedAt: '2026-05-16T08:00:00.000Z'
        })
      );
      await assertSucceeds(
        privilegedDb.doc(`service_orders/order-reopen-${role}`).update({ priority: 'high' })
      );
    }

    const viewDb = accountDb('view-user');
    const auditorDb = accountDb('auditor-user');

    await assertFails(viewDb.doc('service_orders/order-reopen-owner').update({ priority: 'low' }));
    await assertFails(
      auditorDb.doc('service_orders/order-reopen-owner').update({ priority: 'low' })
    );
  });

  it('permite leer evidencias de service_orders a roles operativos y auditoria del account activo', async () => {
    await seedServiceOrderEvidence('order-storage-read');

    for (const role of ['owner', 'admin', 'editor', 'supervisor', 'scheduler', 'operator', 'auditoria']) {
      await seedAccountMember(`${role}-storage-user`, role);

      await assertSucceeds(
        accountStorage(`${role}-storage-user`)
          .ref('service-orders/order-storage-read/attachments/existing.png')
          .getMetadata()
      );
    }
  });

  it('bloquea lectura de evidencias a view, técnico no asignado y account activo incorrecto', async () => {
    await seedServiceOrderEvidence('order-storage-private', { assignedTechnicianId: 'tech-user' });
    await seedAccountMember('view-storage-user', 'view');
    await seedAccountMember('other-tech-storage-user', 'technician');
    await seedAccountMember('operator-storage-user', 'operator');

    const wrongAccountStorage = testEnv!
      .authenticatedContext('operator-storage-user', { activeAccountId: 'account-b', role: 'custom' })
      .storage(`gs://${storageBucket}`);

    await assertFails(
      accountStorage('view-storage-user')
        .ref('service-orders/order-storage-private/attachments/existing.png')
        .getMetadata()
    );
    await assertFails(
      accountStorage('other-tech-storage-user')
        .ref('service-orders/order-storage-private/attachments/existing.png')
        .getMetadata()
    );
    await assertFails(
      wrongAccountStorage.ref('service-orders/order-storage-private/attachments/existing.png').getMetadata()
    );
  });

  it('permite escribir evidencias a roles autorizados y técnico asignado', async () => {
    await seedServiceOrderEvidence('order-storage-write', { assignedTechnicianId: 'tech-storage-user' });
    for (const role of ['owner', 'admin', 'editor', 'supervisor', 'operator']) {
      await seedAccountMember(`${role}-writer-user`, role);

      const uploadResult = await assertSucceeds(
        accountStorage(`${role}-writer-user`)
          .ref(`service-orders/order-storage-write/attachments/${role}.png`)
          .putString('placeholder-image', 'raw', { contentType: 'image/png' })
          .then((snapshot) => snapshot)
      );

      expect(uploadResult.metadata.contentType).toBe('image/png');
    }

    await seedAccountMember('tech-storage-user', 'technician');
    await assertSucceeds(
      accountStorage('tech-storage-user')
        .ref('service-orders/order-storage-write/completion-photos/tech.png')
        .putString('placeholder-image', 'raw', { contentType: 'image/png' })
        .then((snapshot) => snapshot)
    );
  });

  it('bloquea escritura de evidencias a view, auditoria, scheduler y técnico no asignado', async () => {
    await seedServiceOrderEvidence('order-storage-denied', { assignedTechnicianId: 'tech-storage-user' });
    for (const [uid, role] of [
      ['view-storage-writer', 'view'],
      ['auditor-storage-writer', 'auditoria'],
      ['scheduler-storage-writer', 'scheduler'],
      ['other-tech-storage-writer', 'technician']
    ] as const) {
      await seedAccountMember(uid, role);

      await assertFails(
        accountStorage(uid)
          .ref(`service-orders/order-storage-denied/attachments/${uid}.png`)
          .putString('placeholder-image', 'raw', { contentType: 'image/png' })
          .then((snapshot) => snapshot)
      );
    }
  });
});
