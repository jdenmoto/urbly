import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authAdmin, db, FieldValue } from './admin';

const qaPassword = process.env.SEED_DEMO_PASSWORD || 'UrblyDemo2026!';

const demoUsersByRole: Record<AllowedRole, { email: string; role: AllowedRole; administrationId?: string | null }> = {
  admin: { email: 'admin.demo@urbly.local', role: 'admin' },
  editor: { email: 'editor.demo@urbly.local', role: 'editor' },
  view: { email: 'view.demo@urbly.local', role: 'view' },
  scheduler: { email: 'scheduler.demo@urbly.local', role: 'scheduler' },
  supervisor: { email: 'supervisor.demo@urbly.local', role: 'supervisor' },
  operator: { email: 'operator.demo@urbly.local', role: 'operator' },
  auditoria: { email: 'auditoria.demo@urbly.local', role: 'auditoria' },
  emergency_scheduler: { email: 'emergency.demo@urbly.local', role: 'emergency_scheduler' },
  building_admin: { email: 'buildingadmin.demo@urbly.local', role: 'building_admin', administrationId: 'mgmt-aurora' },
  client: { email: 'client.demo@urbly.local', role: 'client', administrationId: 'mgmt-aurora' }
};

const allowedRoles = [
  'admin',
  'editor',
  'view',
  'building_admin',
  'emergency_scheduler',
  'supervisor',
  'scheduler',
  'operator',
  'auditoria',
  'client'
] as const;

type AllowedRole = (typeof allowedRoles)[number];

function requireAdmin(auth: { token?: Record<string, unknown> } | null | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }
  if (auth.token?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }
}

function generatePassword(length = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function resolvePermissions(role: AllowedRole) {
  switch (role) {
    case 'admin':
      return ['export_audit', 'manage_templates', 'manage_ai_policy', 'regenerate_secure_tokens', 'review_reports', 'approve_quotations_internal'];
    case 'supervisor':
      return ['review_reports'];
    case 'auditoria':
      return ['export_audit'];
    default:
      return [];
  }
}

async function resolveAdministrationId(role: AllowedRole, administrationId: string | undefined) {
  if (role === 'building_admin' || role === 'client') {
    if (!administrationId) {
      throw new HttpsError('invalid-argument', 'Administracion requerida.');
    }
    const administrationSnap = await db.collection('management_companies').doc(administrationId).get();
    if (!administrationSnap.exists) {
      throw new HttpsError('not-found', 'Administracion no encontrada.');
    }
    return administrationId;
  }
  return null;
}

export const createUser = onCall(async (request) => {
  requireAdmin(request.auth);
  const email = request.data?.email as string | undefined;
  const role = request.data?.role as AllowedRole | undefined;
  const administrationId = request.data?.administrationId as string | undefined;
  if (!email || !role) {
    throw new HttpsError('invalid-argument', 'Email y rol son requeridos.');
  }
  if (!allowedRoles.includes(role)) {
    throw new HttpsError('invalid-argument', 'Rol invalido.');
  }
  const resolvedAdministrationId = await resolveAdministrationId(role, administrationId);
  const permissions = resolvePermissions(role);
  const password = generatePassword(12);
  const userRecord = await authAdmin.createUser({ email, password, disabled: false });
  await authAdmin.setCustomUserClaims(userRecord.uid, {
    role,
    administrationId: resolvedAdministrationId,
    permissions
  });
  await db.collection('users').doc(userRecord.uid).set({
    email,
    role,
    administrationId: resolvedAdministrationId,
    permissions,
    active: true,
    createdAt: FieldValue.serverTimestamp()
  });
  return { uid: userRecord.uid, password };
});

export const updateUser = onCall(async (request) => {
  requireAdmin(request.auth);
  const uid = request.data?.uid as string | undefined;
  const email = request.data?.email as string | undefined;
  const role = request.data?.role as AllowedRole | undefined;
  const administrationId = request.data?.administrationId as string | undefined;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID requerido.');
  }
  const updatePayload: { email?: string } = {};
  if (email) updatePayload.email = email;
  if (Object.keys(updatePayload).length) {
    await authAdmin.updateUser(uid, updatePayload);
  }
  if (role) {
    if (!allowedRoles.includes(role)) {
      throw new HttpsError('invalid-argument', 'Rol invalido.');
    }
    const resolvedAdministrationId = await resolveAdministrationId(role, administrationId);
    const permissions = resolvePermissions(role);
    await authAdmin.setCustomUserClaims(uid, {
      role,
      administrationId: resolvedAdministrationId,
      permissions
    });
    await db.collection('users').doc(uid).set(
      {
        role,
        administrationId: resolvedAdministrationId,
        permissions
      },
      { merge: true }
    );
  }
  if (email) {
    await db.collection('users').doc(uid).set({ email }, { merge: true });
  }
  return { ok: true };
});

export const setUserDisabled = onCall(async (request) => {
  requireAdmin(request.auth);
  const uid = request.data?.uid as string | undefined;
  const disabled = request.data?.disabled as boolean | undefined;
  if (!uid || typeof disabled !== 'boolean') {
    throw new HttpsError('invalid-argument', 'UID y disabled requeridos.');
  }
  await authAdmin.updateUser(uid, { disabled });
  await db.collection('users').doc(uid).set({ active: !disabled }, { merge: true });
  return { ok: true };
});

export const deleteUser = onCall(async (request) => {
  requireAdmin(request.auth);
  const uid = request.data?.uid as string | undefined;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID requerido.');
  }
  await authAdmin.deleteUser(uid);
  await db.collection('users').doc(uid).delete();
  return { ok: true };
});

export const getQaLogin = onCall(async (request) => {
  const emulatorEnabled = process.env.FUNCTIONS_EMULATOR === 'true';
  const envEnabled = process.env.ENABLE_LOCAL_QA_AUTH === 'true';
  if (!emulatorEnabled && !envEnabled) {
    throw new HttpsError('failed-precondition', 'QA local auth no habilitado.');
  }

  const role = request.data?.role as AllowedRole | undefined;
  if (!role || !allowedRoles.includes(role)) {
    throw new HttpsError('invalid-argument', 'Rol invalido.');
  }

  const demoUser = demoUsersByRole[role];

  let userRecord;
  try {
    userRecord = await authAdmin.getUserByEmail(demoUser.email);
    await authAdmin.updateUser(userRecord.uid, {
      password: qaPassword,
      disabled: false,
      emailVerified: true
    });
  } catch {
    userRecord = await authAdmin.createUser({
      email: demoUser.email,
      password: qaPassword,
      emailVerified: true,
      disabled: false
    });
  }

  const permissions = resolvePermissions(demoUser.role);
  const administrationId = demoUser.administrationId ?? null;

  await authAdmin.setCustomUserClaims(userRecord.uid, {
    role: demoUser.role,
    permissions,
    administrationId
  });

  await db.collection('users').doc(userRecord.uid).set(
    {
      email: demoUser.email,
      role: demoUser.role,
      active: true,
      administrationId,
      permissions,
      seededAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  return {
    email: demoUser.email,
    password: qaPassword,
    role: demoUser.role
  };
});
