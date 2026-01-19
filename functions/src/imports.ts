import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import * as XLSX from 'xlsx';
import { db, FieldValue } from './admin';

type ImportRow = {
  building_name?: string;
  address?: string;
  porter_phone?: string;
  management_name?: string;
};

type GeocodeResult = {
  formattedAddress: string;
  placeId: string;
  location: { lat: number; lng: number };
};

const mapsApiKey = defineSecret('GOOGLE_MAPS_API_KEY');

async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const apiKey = mapsApiKey.value();
  if (!apiKey) {
    throw new Error('Missing GOOGLE_MAPS_API_KEY');
  }
  logger.info('Geocoding address', { address });
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', address);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('region', 'co');
  url.searchParams.set('components', 'country:CO');
  const response = await fetch(url.toString());
  if (!response.ok) {
    logger.error('Geocoding request failed', { status: response.status });
    throw new Error('Geocoding request failed');
  }
  const data = (await response.json()) as {
    status: string;
    results: Array<{ formatted_address: string; place_id: string; geometry: { location: { lat: number; lng: number } } }>;
  };
  if (data.status !== 'OK' || !data.results.length) {
    logger.warn('Geocoding returned no results', { status: data.status });
    throw new Error(`Geocoding status: ${data.status}`);
  }
  const result = data.results[0];
  return {
    formattedAddress: result.formatted_address,
    placeId: result.place_id,
    location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng }
  };
}

export const importBuildings = onCall({ secrets: [mapsApiKey] }, async (request) => {
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
  logger.info('Import rows parsed', { count: rows.length });

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
      logger.warn('Missing required fields', { row: rowNumber });
      errors.push({ row: rowNumber, message: 'Campos requeridos faltantes.' });
      continue;
    }

    const managementKey = row.management_name.toLowerCase();
    let managementId = managementByName.get(managementKey);
    if (!managementId) {
      logger.info('Creating management company', { name: row.management_name });
      const newDoc = await db.collection('management_companies').add({
        name: row.management_name,
        contactPhone: '',
        email: '',
        nit: 'PENDING',
        address: '',
        createdAt: FieldValue.serverTimestamp()
      });
      managementId = newDoc.id;
      managementByName.set(managementKey, managementId);
    }

    let geocode: GeocodeResult;
    try {
      geocode = await geocodeAddress(row.address);
    } catch (error) {
      logger.warn('Geocode failed', { row: rowNumber, address: row.address });
      errors.push({ row: rowNumber, message: 'Direccion no valida o no encontrada.' });
      continue;
    }

    await db.collection('buildings').add({
      name: row.building_name,
      porterPhone: row.porter_phone,
      managementCompanyId: managementId,
      addressText: geocode.formattedAddress,
      googlePlaceId: geocode.placeId,
      location: geocode.location,
      createdAt: FieldValue.serverTimestamp()
    });
    created += 1;
  }

  logger.info('Import completed', { created, failed: errors.length });
  return {
    created,
    failed: errors.length,
    errors
  };
});
