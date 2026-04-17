import { logger } from 'firebase-functions';
import { db, FieldValue } from './admin';

export type BuildingImportRow = {
  building_name?: string;
  address?: string;
  porter_phone?: string;
  management_name?: string;
};

export type GeocodeResult = {
  formattedAddress: string;
  placeId: string;
  location: { lat: number; lng: number };
};

export async function buildManagementIndex() {
  const managementSnapshot = await db.collection('management_companies').get();
  const managementByName = new Map<string, string>();
  managementSnapshot.forEach((doc) => {
    const data = doc.data() as { name?: string };
    if (data.name) {
      managementByName.set(data.name.toLowerCase(), doc.id);
    }
  });
  return managementByName;
}

export async function resolveManagementId(args: { row: BuildingImportRow; managementByName: Map<string, string> }) {
  const { row, managementByName } = args;
  const managementKey = String(row.management_name ?? '').toLowerCase();
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
  return managementId;
}

export async function persistBuildingImport(args: {
  rows: BuildingImportRow[];
  geocodeAddress: (address: string) => Promise<GeocodeResult>;
}) {
  const { rows, geocodeAddress } = args;
  const managementByName = await buildManagementIndex();
  const errors: Array<{ row: number; message: string }> = [];
  let created = 0;

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2;
    const managementId = await resolveManagementId({ row, managementByName });

    let geocode: GeocodeResult;
    try {
      geocode = await geocodeAddress(String(row.address ?? ''));
    } catch {
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
      active: true,
      createdAt: FieldValue.serverTimestamp()
    });
    created += 1;
  }

  return { created, errors };
}
