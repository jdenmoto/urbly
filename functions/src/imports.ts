import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { parseImportWorkbook } from './importParser';
import { validateImportRows } from './importValidation';
import { persistBuildingImport, type BuildingImportRow, type GeocodeResult } from './importBuildingPipeline';


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
  const dryRun = Boolean(data?.dryRun);
  if (!downloadUrl || !fileName) {
    throw new HttpsError('invalid-argument', 'Archivo invalido.');
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

  const { created, errors } = await persistBuildingImport({ rows, geocodeAddress });

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
