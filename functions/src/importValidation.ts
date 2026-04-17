export type ImportEntityKind = 'building' | 'management' | 'unknown';
export type GenericImportRow = Record<string, string>;
export type ImportValidationIssue = { row: number; message: string };
export type ImportValidationSummary = {
  entity: ImportEntityKind;
  validRows: number;
  invalidRows: number;
  issues: ImportValidationIssue[];
};

const requiredByEntity: Record<ImportEntityKind, string[]> = {
  building: ['building_name', 'address', 'porter_phone', 'management_name'],
  management: ['management_name'],
  unknown: []
};

export function detectImportEntity(headers: string[]): ImportEntityKind {
  const normalized = headers.map((item) => item.trim().toLowerCase());
  if (normalized.includes('building_name') || normalized.includes('porter_phone')) return 'building';
  if (normalized.includes('management_name') || normalized.includes('management_email') || normalized.includes('management_phone')) return 'management';
  return 'unknown';
}

export function validateImportRows(args: { headers: string[]; rows: GenericImportRow[] }): ImportValidationSummary {
  const entity = detectImportEntity(args.headers);
  const required = requiredByEntity[entity] ?? [];
  const issues: ImportValidationIssue[] = [];

  args.rows.forEach((row, index) => {
    const missing = required.filter((field) => !String(row[field] ?? '').trim());
    if (missing.length) {
      issues.push({ row: index + 2, message: `Faltan campos requeridos: ${missing.join(', ')}` });
    }
  });

  return {
    entity,
    validRows: args.rows.length - issues.length,
    invalidRows: issues.length,
    issues
  };
}
