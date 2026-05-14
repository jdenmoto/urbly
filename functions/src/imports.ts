import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { db } from './admin';
import { parseImportWorkbook } from './importParser';
import { validateImportRows } from './importValidation';
import { persistBuildingImport, type BuildingImportRow, type GeocodeResult } from './importBuildingPipeline';


const mapsApiKey = defineSecret('GOOGLE_MAPS_API_KEY');
const IMPORT_BUILDINGS_PERMISSION = 'import_buildings';
const IMPORT_BUILDINGS_ROLES = new Set(['owner', 'admin', 'editor']);

type AuthShape = { uid?: string; token?: Record<string, unknown> } | null | undefined;
type AccountMemberData = Record<string, any> | null | undefined;

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function requireAuth(auth: AuthShape): asserts auth is NonNullable<AuthShape> & { uid: string } {
  if (!auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }
}

function getActiveAccountId(auth: AuthShape) {
  return getString(auth?.token?.activeAccountId);
}

export function canImportBuildingsForMember(member: AccountMemberData) {
  if (member?.active !== true) return false;
  const role = getString(member.role);
  if (role && IMPORT_BUILDINGS_ROLES.has(role)) return true;
  const permissions = Array.isArray(member.permissions) ? member.permissions : [];
  return permissions.includes(IMPORT_BUILDINGS_PERMISSION);
}

export function isControlledImportDownloadUrl(downloadUrl: string) {
  try {
    const url = new URL(downloadUrl);
    if (url.protocol !== 'https:' || url.hostname !== 'firebasestorage.googleapis.com') return false;
    const objectPath = decodeURIComponent(url.pathname);
    return objectPath.includes('/o/imports/');
  } catch {
    return false;
  }
}

async function assertCanImportBuildings(auth: AuthShape) {
  requireAuth(auth);
  const accountId = getActiveAccountId(auth);
  if (!accountId) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }

  const memberSnap = await db.collection('accounts').doc(accountId).collection('members').doc(auth.uid).get();
  if (!memberSnap.exists) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }

  const member = memberSnap.data() as AccountMemberData;
  if (!canImportBuildingsForMember(member)) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }

  return accountId;
}

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
  const accountId = await assertCanImportBuildings(auth);

  const downloadUrl = data?.downloadUrl as string | undefined;
  const fileName = data?.fileName as string | undefined;
  const dryRun = Boolean(data?.dryRun);
  if (!downloadUrl || !fileName) {
    throw new HttpsError('invalid-argument', 'Archivo invalido.');
  }
  if (!isControlledImportDownloadUrl(downloadUrl)) {
    throw new HttpsError('permission-denied', 'Archivo no autorizado.');
  }

  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new HttpsError('not-found', 'No se pudo descargar el archivo.');
  }

  const arrayBuffer = await response.arrayBuffer();
  const parsed = await parseImportWorkbook({ arrayBuffer, fileName });
  if (!parsed.rows.length) {
    throw new HttpsError('invalid-argument', 'Archivo sin datos.');
  }
  const rows = parsed.rows as BuildingImportRow[];
  logger.info('Import rows parsed', { count: rows.length });

  const validation = validateImportRows({ headers: parsed.headers, rows: parsed.rows });
  if (validation.invalidRows > 0) {
    logger.warn('Import validation failed', { invalidRows: validation.invalidRows, entity: validation.entity });
    return {
      created: 0,
      failed: validation.invalidRows,
      errors: validation.issues,
      entity: validation.entity,
      dryRun,
      validRows: validation.validRows,
      summaryMessage: 'La validación detectó filas inválidas antes de importar.'
    };
  }

  if (dryRun) {
    return {
      created: 0,
      failed: 0,
      errors: [],
      entity: validation.entity,
      dryRun: true,
      previewCount: rows.length,
      validRows: validation.validRows,
      summaryMessage: 'Validación remota completada.'
    };
  }

  const { created, errors } = await persistBuildingImport({ rows, accountId, geocodeAddress });

  logger.info('Import completed', { created, failed: errors.length });
  return {
    created,
    failed: errors.length,
    errors,
    entity: validation.entity,
    dryRun: false,
    validRows: created,
    summaryMessage: errors.length ? 'Importación finalizada con observaciones.' : 'Importación completada correctamente.'
  };
});
