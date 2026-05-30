import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local'), override: true });

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
const demoPassword = process.env.SEED_DEMO_PASSWORD || 'UrblyDemo2026!';
const inlineServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!projectId || (!serviceAccountPath && !inlineServiceAccount)) {
  console.error(
    'Missing env vars: FIREBASE_PROJECT_ID and one of FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT'
  );
  process.exit(1);
}

let serviceAccount;
if (inlineServiceAccount) {
  try {
    serviceAccount = JSON.parse(inlineServiceAccount);
  } catch {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT JSON');
    process.exit(1);
  }
} else {
  const absolutePath = path.resolve(serviceAccountPath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Service account file not found: ${absolutePath}`);
    process.exit(1);
  }
  serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: projectId || serviceAccount.project_id
});

const auth = admin.auth();
const db = admin.firestore();

const demoUsers = [
  { email: 'admin.demo@urbly.local', role: 'admin' },
  { email: 'editor.demo@urbly.local', role: 'editor' },
  { email: 'view.demo@urbly.local', role: 'view' },
  { email: 'scheduler.demo@urbly.local', role: 'scheduler' },
  { email: 'supervisor.demo@urbly.local', role: 'supervisor' },
  { email: 'operator.demo@urbly.local', role: 'operator' },
  { email: 'auditoria.demo@urbly.local', role: 'auditoria' },
  { email: 'emergency.demo@urbly.local', role: 'emergency_scheduler' },
  { email: 'buildingadmin.demo@urbly.local', role: 'building_admin', administrationId: 'mgmt-aurora' },
  { email: 'client.demo@urbly.local', role: 'client', administrationId: 'mgmt-aurora' }
];

const permissionsByRole = {
  admin: ['export_audit', 'manage_templates', 'manage_ai_policy', 'regenerate_secure_tokens', 'review_reports', 'approve_quotations_internal'],
  supervisor: ['review_reports', 'approve_quotations_internal'],
  auditoria: ['export_audit'],
  editor: ['manage_templates', 'manage_ai_policy'],
  building_admin: ['regenerate_secure_tokens'],
  client: [],
  scheduler: [],
  operator: [],
  emergency_scheduler: [],
  view: []
};

for (const userData of demoUsers) {
  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(userData.email);
    await auth.updateUser(userRecord.uid, {
      password: demoPassword,
      disabled: false,
      emailVerified: true
    });
  } catch {
    userRecord = await auth.createUser({
      email: userData.email,
      password: demoPassword,
      emailVerified: true,
      disabled: false
    });
  }

  const claims = {
    role: userData.role,
    permissions: permissionsByRole[userData.role] || [],
    administrationId: userData.administrationId || null
  };

  await auth.setCustomUserClaims(userRecord.uid, claims);

  await db.collection('users').doc(userRecord.uid).set(
    {
      email: userData.email,
      role: userData.role,
      active: true,
      administrationId: userData.administrationId || null,
      permissions: claims.permissions,
      createdAt: userRecord.metadata.creationTime || new Date().toISOString(),
      seededAt: admin.firestore.FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  console.log(`Seeded demo user ${userData.email} (${userData.role})`);
}

console.log(`Demo users ready. Shared password: ${demoPassword}`);
