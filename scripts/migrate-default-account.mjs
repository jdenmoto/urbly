#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

const DEFAULT_ACCOUNT_ID = 'urbly-default';
const DEFAULT_ACCOUNT_NAME = 'Urbly Default';
const BATCH_LIMIT = 400;
const CRITICAL_COLLECTIONS = [
  'employees',
  'service_orders',
  'buildings',
  'management_companies',
  'contracts',
  'customers',
  'assets',
  'internal_notifications',
  'tenant_templates',
  'tenant_ai_policies',
  'reports',
  'client_requests',
];

const ACCOUNT_ROLE_BY_LEGACY_ROLE = {
  admin: 'admin',
  editor: 'editor',
  view: 'view',
  building_admin: 'building_admin',
  emergency_scheduler: 'technician',
  supervisor: 'supervisor',
  scheduler: 'scheduler',
  operator: 'operator',
  auditoria: 'auditoria',
  client: 'client',
  owner: 'owner',
  technician: 'technician',
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run') || !args.has('--commit');
const commit = args.has('--commit');
const confirmProduction = args.has('--confirm-production');

if (args.has('--help')) {
  console.log(`Usage: node scripts/migrate-default-account.mjs [--dry-run|--commit] [--confirm-production]\n\nCreates accounts/${DEFAULT_ACCOUNT_ID}, assigns existing tenant data to it,\nand creates accounts/${DEFAULT_ACCOUNT_ID}/members/{uid} for existing users.\n\nDefault mode is dry-run. --commit writes data. Production commits require --confirm-production.`);
  process.exit(0);
}

if (dryRun && commit) {
  fail('Usa solo uno: --dry-run o --commit.');
}

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local'), override: true });
dotenv.config({ path: path.resolve('.env.emulator') });

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function warn(message) {
  console.warn(`⚠️  ${message}`);
}

function hasCredentials() {
  return Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_SERVICE_ACCOUNT ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID,
  );
}

function resolveServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      fail('FIREBASE_SERVICE_ACCOUNT no es JSON válido.');
    }
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!serviceAccountPath) return null;

  const absolutePath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Service account file not found: ${absolutePath}`);
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
}

function initFirestore() {
  const serviceAccount = resolveServiceAccount();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    serviceAccount?.project_id ||
    process.env.VITE_FIREBASE_PROJECT_ID;

  if (!projectId && !process.env.FIRESTORE_EMULATOR_HOST) {
    fail('Falta FIREBASE_PROJECT_ID/GOOGLE_CLOUD_PROJECT o FIRESTORE_EMULATOR_HOST.');
  }

  const appOptions = { projectId };
  if (serviceAccount) {
    appOptions.credential = admin.credential.cert(serviceAccount);
  } else if (!process.env.FIRESTORE_EMULATOR_HOST) {
    appOptions.credential = admin.credential.applicationDefault();
  }

  admin.initializeApp(appOptions);
  return { db: admin.firestore(), projectId: projectId || 'emulator' };
}

function ensureSafeCommit(projectId) {
  if (dryRun) return;
  if (!confirmProduction && !process.env.FIRESTORE_EMULATOR_HOST) {
    fail(`Commit bloqueado para proyecto ${projectId}. Ejecuta primero --dry-run y usa --commit --confirm-production si la migración es intencional.`);
  }
}

function assertDefaultAccountId(value, label, ambiguous) {
  if (typeof value === 'string' && value.length > 0 && value !== DEFAULT_ACCOUNT_ID) {
    ambiguous.push(`${label} ya tiene accountId=${value}`);
  }
}

function normalizeRole(role) {
  return ACCOUNT_ROLE_BY_LEGACY_ROLE[role] || 'view';
}

function serverTimestamp() {
  return admin.firestore.FieldValue.serverTimestamp();
}

function arrayUnion(value) {
  return admin.firestore.FieldValue.arrayUnion(value);
}

async function collectionExists(db, collectionName) {
  const snap = await db.collection(collectionName).limit(1).get();
  return !snap.empty;
}

async function getAllDocs(db, collectionName) {
  const snap = await db.collection(collectionName).get();
  return snap.docs;
}

async function collectPlan(db) {
  const ambiguous = [];
  const writes = [];
  const existingCollections = [];

  const accountRef = db.collection('accounts').doc(DEFAULT_ACCOUNT_ID);
  const accountSnap = await accountRef.get();
  if (accountSnap.exists) {
    const account = accountSnap.data() || {};
    assertDefaultAccountId(account.id, `accounts/${DEFAULT_ACCOUNT_ID}`, ambiguous);
  } else {
    writes.push({ ref: accountRef, data: { id: DEFAULT_ACCOUNT_ID, name: DEFAULT_ACCOUNT_NAME, active: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, options: { merge: true }, reason: `crear accounts/${DEFAULT_ACCOUNT_ID}` });
  }

  for (const collectionName of CRITICAL_COLLECTIONS) {
    const exists = await collectionExists(db, collectionName);
    if (!exists) continue;
    existingCollections.push(collectionName);
    const docs = await getAllDocs(db, collectionName);

    for (const doc of docs) {
      const data = doc.data() || {};
      assertDefaultAccountId(data.accountId, `${collectionName}/${doc.id}`, ambiguous);
      if (data.accountId !== DEFAULT_ACCOUNT_ID) {
        writes.push({ ref: doc.ref, data: { accountId: DEFAULT_ACCOUNT_ID, updatedAt: serverTimestamp() }, options: { merge: true }, reason: `asignar ${collectionName}/${doc.id} a ${DEFAULT_ACCOUNT_ID}` });
      }
    }
  }

  const users = await getAllDocs(db, 'users');
  for (const user of users) {
    const data = user.data() || {};
    const uid = user.id;
    const accountIds = Array.isArray(data.accountIds) ? data.accountIds : [];

    if (accountIds.some((accountId) => accountId !== DEFAULT_ACCOUNT_ID)) {
      ambiguous.push(`users/${uid} tiene accountIds=${JSON.stringify(accountIds)}`);
    }
    if (data.activeAccountId && data.activeAccountId !== DEFAULT_ACCOUNT_ID) {
      ambiguous.push(`users/${uid} tiene activeAccountId=${data.activeAccountId}`);
    }
    assertDefaultAccountId(data.accountId, `users/${uid}`, ambiguous);

    const memberRef = accountRef.collection('members').doc(uid);
    const memberSnap = await memberRef.get();
    if (memberSnap.exists) {
      const member = memberSnap.data() || {};
      assertDefaultAccountId(member.accountId, `accounts/${DEFAULT_ACCOUNT_ID}/members/${uid}`, ambiguous);
      if (member.uid && member.uid !== uid) {
        ambiguous.push(`accounts/${DEFAULT_ACCOUNT_ID}/members/${uid} tiene uid=${member.uid}`);
      }
    } else {
      writes.push({
        ref: memberRef,
        data: {
          uid,
          accountId: DEFAULT_ACCOUNT_ID,
          email: data.email || '',
          role: normalizeRole(data.role),
          active: data.active !== false,
          permissions: Array.isArray(data.permissions) ? data.permissions : [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        options: { merge: true },
        reason: `crear membership para users/${uid}`,
      });
    }

    const userUpdate = { accountIds: arrayUnion(DEFAULT_ACCOUNT_ID), activeAccountId: DEFAULT_ACCOUNT_ID, updatedAt: serverTimestamp() };
    if (data.accountId !== DEFAULT_ACCOUNT_ID) userUpdate.accountId = DEFAULT_ACCOUNT_ID;
    writes.push({ ref: user.ref, data: userUpdate, options: { merge: true }, reason: `actualizar users/${uid} con account ${DEFAULT_ACCOUNT_ID}` });
  }

  const settingsSnap = await db.collection('settings').get();
  for (const settingDoc of settingsSnap.docs) {
    const targetRef = accountRef.collection('settings').doc(settingDoc.id);
    const targetSnap = await targetRef.get();
    if (!targetSnap.exists) {
      writes.push({ ref: targetRef, data: { ...settingDoc.data(), updatedAt: serverTimestamp() }, options: { merge: true }, reason: `copiar settings/${settingDoc.id} a cuenta default` });
    }
  }

  return { ambiguous, writes, existingCollections, usersCount: users.length, settingsCount: settingsSnap.size };
}

async function commitWrites(db, writes) {
  let batch = db.batch();
  let pending = 0;
  let committed = 0;

  for (const write of writes) {
    batch.set(write.ref, write.data, write.options || { merge: true });
    pending += 1;

    if (pending >= BATCH_LIMIT) {
      await batch.commit();
      committed += pending;
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) {
    await batch.commit();
    committed += pending;
  }

  return committed;
}

if (dryRun && !hasCredentials()) {
  warn('No hay credenciales Firebase ni FIRESTORE_EMULATOR_HOST. Dry-run de conectividad omitido.');
  console.log(`Plan estático: crearía/validaría accounts/${DEFAULT_ACCOUNT_ID}, users memberships, accountId en colecciones críticas y settings por cuenta.`);
  console.log('Para validar datos reales: configura FIRESTORE_EMULATOR_HOST o credenciales Firebase y vuelve a correr --dry-run.');
  process.exit(0);
}

const { db, projectId } = initFirestore();
ensureSafeCommit(projectId);

console.log(`${dryRun ? 'DRY-RUN' : 'COMMIT'} migrate-default-account project=${projectId} account=${DEFAULT_ACCOUNT_ID}`);
const plan = await collectPlan(db);

if (plan.ambiguous.length > 0) {
  console.error('Datos ambiguos detectados. No se escribirá nada:');
  for (const item of plan.ambiguous) console.error(`- ${item}`);
  process.exit(1);
}

console.log(`Colecciones críticas existentes: ${plan.existingCollections.join(', ') || 'ninguna'}`);
console.log(`Usuarios encontrados: ${plan.usersCount}`);
console.log(`Settings raíz encontrados: ${plan.settingsCount}`);
console.log(`Escrituras necesarias: ${plan.writes.length}`);
for (const write of plan.writes.slice(0, 30)) console.log(`- ${write.reason}`);
if (plan.writes.length > 30) console.log(`... ${plan.writes.length - 30} escrituras adicionales`);

if (dryRun) {
  console.log('Dry-run completo. No se escribió nada.');
  process.exit(0);
}

const committed = await commitWrites(db, plan.writes);
console.log(`Migración completa. Escrituras aplicadas: ${committed}`);
