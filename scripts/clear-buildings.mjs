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

async function deleteCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`No documents in ${collectionName}`);
    return;
  }
  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`Deleted ${snapshot.size} documents from ${collectionName}`);
}

await deleteCollection('buildings');
