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
  let created = 0;
  for (const item of items) {
    const { id, ...data } = item;
    const docRef = db.collection(name).doc(id);
    const snapshot = await docRef.get();
    if (snapshot.exists) continue;
    await docRef.set(data);
    created += 1;
  }
  console.log(`Seeded ${name}: ${created} created, ${items.length - created} skipped`);
}

const collections = ['management_companies', 'buildings', 'contracts', 'employees', 'appointments', 'feature_flags'];
for (const collection of collections) {
  const items = seed[collection] || [];
  if (!items.length) continue;
  await writeCollection(collection, items);
}

const settings = seed.settings || {};
for (const [docId, payload] of Object.entries(settings)) {
  if (!payload || typeof payload !== 'object') continue;
  await db.collection('settings').doc(docId).set(payload, { merge: true });
  console.log(`Seeded settings/${docId}`);
}

const appointmentTypes = ['mantenimiento', 'lavado_tanque', 'emergencia', 'interventoria'];
const appointmentStatuses = ['programado', 'confirmado'];
const weekStart = (() => {
  const today = new Date();
  const day = today.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(today);
  start.setDate(today.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
})();

const seedEmployees = seed.employees || [];
const seedBuildings = seed.buildings || [];
const employeeIds = seedEmployees.map((item) => item.id);
const buildingIds = seedBuildings.map((item) => item.id);

if (employeeIds.length && buildingIds.length) {
  const slots = [8, 10, 12, 14, 16];
  const totalAppointments = 30;
  const appointments = Array.from({ length: totalAppointments }, (_, index) => {
    const dayOffset = Math.floor(index / slots.length);
    const slotOffset = index % slots.length;
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + dayOffset);
    start.setHours(slots[slotOffset], 0, 0, 0);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    return {
      id: `apt-${String(index + 100).padStart(3, '0')}`,
      buildingId: buildingIds[index % buildingIds.length],
      title: `Servicio ${index + 1}`,
      description: 'Agendamiento semanal',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: appointmentStatuses[index % appointmentStatuses.length],
      type: appointmentTypes[index % appointmentTypes.length],
      employeeId: employeeIds[index % employeeIds.length],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
  });

  await writeCollection('appointments', appointments);
}

if (buildingIds.length) {
  const year = new Date().getFullYear();
  const maintenanceAppointments = Array.from({ length: 12 }, (_, index) => {
    const start = new Date(Date.UTC(year, index, 15, 14, 0, 0));
    const end = new Date(Date.UTC(year, index, 15, 15, 0, 0));
    return {
      id: `maint-${year}-${String(index + 1).padStart(2, '0')}`,
      buildingId: buildingIds[index % buildingIds.length],
      title: `Mantenimiento ${index + 1}`,
      description: 'Mantenimiento mensual',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      status: 'programado',
      type: 'mantenimiento',
      employeeId: employeeIds[index % (employeeIds.length || 1)] || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };
  });
  await writeCollection('appointments', maintenanceAppointments);
}

console.log('Seed completed.');
