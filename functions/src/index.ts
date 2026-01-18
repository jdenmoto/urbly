import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as XLSX from 'xlsx';

initializeApp();

const db = getFirestore();

type ImportRow = {
  building_name?: string;
  address?: string;
  porter_phone?: string;
  management_name?: string;
};

export const importBuildings = onCall(async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }

  const downloadUrl = data?.downloadUrl as string | undefined;
  const fileName = data?.fileName as string | undefined;
  if (!downloadUrl || !fileName) {
    throw new HttpsError('invalid-argument', 'Archivo invalido.');
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new HttpsError('not-found', 'No se pudo descargar el archivo.');
  }

  const arrayBuffer = await response.arrayBuffer();
  let workbook: XLSX.WorkBook;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const csvText = Buffer.from(arrayBuffer).toString('utf8');
    workbook = XLSX.read(csvText, { type: 'string' });
  } else {
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<ImportRow>(sheet, { defval: '' });

  const managementSnapshot = await db.collection('management_companies').get();
  const managementByName = new Map<string, string>();
  managementSnapshot.forEach((doc) => {
    const data = doc.data() as { name?: string };
    if (data.name) {
      managementByName.set(data.name.toLowerCase(), doc.id);
    }
  });

  const errors: Array<{ row: number; message: string }> = [];
  let created = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    if (!row.building_name || !row.address || !row.porter_phone || !row.management_name) {
      errors.push({ row: rowNumber, message: 'Campos requeridos faltantes.' });
      continue;
    }

    const managementId = managementByName.get(row.management_name.toLowerCase());
    if (!managementId) {
      errors.push({ row: rowNumber, message: 'Administracion no encontrada.' });
      continue;
    }

    await db.collection('buildings').add({
      name: row.building_name,
      porterPhone: row.porter_phone,
      managementCompanyId: managementId,
      addressText: row.address,
      googlePlaceId: '',
      location: { lat: 0, lng: 0 },
      createdAt: FieldValue.serverTimestamp()
    });
    created += 1;
  }

  return {
    created,
    failed: errors.length,
    errors
  };
});
