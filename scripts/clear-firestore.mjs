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

const db = admin.firestore();
const keepCollections = new Set(['users']);
const batchLimit = 400;

async function deleteQueryBatch(query) {
  const snapshot = await query.get();
  if (snapshot.size === 0) return 0;
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return snapshot.size;
}

async function deleteCollection(collectionRef) {
  let deleted = 0;
  while (true) {
    const count = await deleteQueryBatch(collectionRef.limit(batchLimit));
    deleted += count;
    if (count < batchLimit) break;
  }
  return deleted;
}

async function run() {
  const collections = await db.listCollections();
  for (const col of collections) {
    if (keepCollections.has(col.id)) {
      console.log(`Skipping collection ${col.id}`);
      continue;
    }
    const removed = await deleteCollection(col);
    console.log(`Deleted ${removed} docs from ${col.id}`);
  }
  console.log('Firestore cleanup completed.');
}

run().catch((error) => {
  console.error('Firestore cleanup failed', error);
  process.exit(1);
});
