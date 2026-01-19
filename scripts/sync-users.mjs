import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve('.env') });
dotenv.config({ path: path.resolve('.env.local'), override: true });

const projectId = process.env.FIREBASE_PROJECT_ID;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

if (!projectId || !serviceAccountPath) {
  console.error('Missing env vars: FIREBASE_PROJECT_ID and FIREBASE_SERVICE_ACCOUNT_PATH');
  process.exit(1);
}

const absolutePath = path.resolve(serviceAccountPath);
if (!fs.existsSync(absolutePath)) {
  console.error(`Service account file not found: ${absolutePath}`);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf-8'));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId
});

const auth = admin.auth();
const db = admin.firestore();

const BATCH_LIMIT = 400;
let pageToken;
let total = 0;
let synced = 0;

do {
  const result = await auth.listUsers(1000, pageToken);
  total += result.users.length;
  let batch = db.batch();
  let batchCount = 0;

  for (const user of result.users) {
    const role = user.customClaims?.role || 'view';
    const docRef = db.collection('users').doc(user.uid);
    batch.set(
      docRef,
      {
        email: user.email || '',
        role,
        active: !user.disabled,
        createdAt: user.metadata.creationTime || null,
        syncedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );
    batchCount += 1;
    synced += 1;

    if (batchCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  pageToken = result.pageToken;
} while (pageToken);

console.log(`Synced ${synced} of ${total} auth users into Firestore.`);
