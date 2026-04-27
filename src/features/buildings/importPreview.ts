export type ImportEntityKind = 'building' | 'management' | 'unknown';

export type GenericPreviewRow = Record<string, string>;

export function detectImportEntity(headers: string[]): ImportEntityKind {
  const normalized = headers.map((item) => item.trim().toLowerCase());
  if (normalized.includes('building_name') || normalized.includes('porter_phone')) return 'building';
  if (normalized.includes('management_name') || normalized.includes('management_email') || normalized.includes('management_phone')) return 'management';
  return 'unknown';
}

export function groupPreviewRows(rows: GenericPreviewRow[]) {
  if (!rows.length) return { entity: 'unknown' as ImportEntityKind, rows: [] as GenericPreviewRow[], headers: [] as string[] };
  const headers = Object.keys(rows[0] ?? {});
  return {
    entity: detectImportEntity(headers),
    rows,
    headers
  };
}
