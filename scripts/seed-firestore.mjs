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
const seedPath = path.resolve('seed/seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));

async function writeCollection(name, items) {
  const batch = db.batch();
  items.forEach((item) => {
    const { id, ...data } = item;
    const docRef = db.collection(name).doc(id);
    batch.set(docRef, data, { merge: true });
  });
  await batch.commit();
  console.log(`Seeded ${name}: ${items.length}`);
}

const collections = ['management_companies', 'buildings', 'employees', 'appointments'];
for (const collection of collections) {
  const items = seed[collection] || [];
  if (!items.length) continue;
  await writeCollection(collection, items);
}

console.log('Seed completed.');
