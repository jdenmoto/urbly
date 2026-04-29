import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local'), override: true });

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.FIREBASE_PROJECT_ID;

function resolveServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
      process.exit(1);
    }
  }

  if (!serviceAccountPath) {
    console.error('Missing env vars: FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT');
    process.exit(1);
  }

  const absolutePath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Service account file not found: ${absolutePath}`);
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
}

const serviceAccount = resolveServiceAccount();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: projectId || serviceAccount.project_id,
});

const db = admin.firestore();

async function count(collection) {
  const snap = await db.collection(collection).limit(200).get();
  return snap.size;
}

async function hasSettings(docId) {
  const snap = await db.collection('settings').doc(docId).get();
  return snap.exists;
}

async function countWhere(collection, field, operator, value) {
  const snap = await db.collection(collection).where(field, operator, value).limit(200).get();
  return snap.size;
}

const checks = [
  { key: 'management_companies', min: 1 },
  { key: 'buildings', min: 1 },
  { key: 'employees', min: 1 },
  { key: 'service_orders', min: 3 },
  { key: 'users', min: 1 },
];

let hasError = false;
for (const check of checks) {
  const value = await count(check.key);
  if (value < check.min) {
    hasError = true;
    console.error(`Smoke check failed: ${check.key} has ${value}, expected >= ${check.min}`);
  } else {
    console.log(`Smoke check ok: ${check.key}=${value}`);
  }
}

const hasServiceTypes = await hasSettings('service_types');
if (!hasServiceTypes) {
  hasError = true;
  console.error('Smoke check failed: settings/service_types does not exist');
} else {
  console.log('Smoke check ok: settings/service_types exists');
}

const assignedOrders = await countWhere('service_orders', 'assignedTechnicianId', '!=', null);
if (assignedOrders < 1) {
  hasError = true;
  console.error(`Smoke check failed: service_orders assignedTechnicianId has ${assignedOrders}, expected >= 1`);
} else {
  console.log(`Smoke check ok: service_orders assignedTechnicianId>=1 (${assignedOrders})`);
}

if (hasError) process.exit(1);
console.log('Seed smoke check passed.');
