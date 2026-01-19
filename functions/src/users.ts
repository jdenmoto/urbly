import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { authAdmin, db, FieldValue } from './admin';

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

export const createUser = onCall(async (request) => {
  requireAdmin(request.auth);
  const email = request.data?.email as string | undefined;
  const role = request.data?.role as string | undefined;
  if (!email || !role) {
    throw new HttpsError('invalid-argument', 'Email y rol son requeridos.');
  }
  if (!['admin', 'editor', 'view'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Rol invalido.');
  }
  const password = generatePassword(12);
  const userRecord = await authAdmin.createUser({ email, password, disabled: false });
  await authAdmin.setCustomUserClaims(userRecord.uid, { role });
  await db.collection('users').doc(userRecord.uid).set({
    email,
    role,
    active: true,
    createdAt: FieldValue.serverTimestamp()
  });
  return { uid: userRecord.uid, password };
});

export const updateUser = onCall(async (request) => {
  requireAdmin(request.auth);
  const uid = request.data?.uid as string | undefined;
  const email = request.data?.email as string | undefined;
  const role = request.data?.role as string | undefined;
  if (!uid) {
    throw new HttpsError('invalid-argument', 'UID requerido.');
  }
  const updatePayload: { email?: string } = {};
  if (email) updatePayload.email = email;
  if (Object.keys(updatePayload).length) {
    await authAdmin.updateUser(uid, updatePayload);
  }
  if (role) {
    if (!['admin', 'editor', 'view'].includes(role)) {
      throw new HttpsError('invalid-argument', 'Rol invalido.');
    }
    await authAdmin.setCustomUserClaims(uid, { role });
    await db.collection('users').doc(uid).set({ role }, { merge: true });
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
