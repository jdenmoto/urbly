import { detectImportEntity, type GenericPreviewRow, type ImportEntityKind } from './importPreview';

export type ImportValidationIssue = {
  row: number;
  message: string;
};

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

export function validateImportRows(rows: GenericPreviewRow[]): ImportValidationSummary {
  const headers = Object.keys(rows[0] ?? {});
  const entity = detectImportEntity(headers);
  const required = requiredByEntity[entity] ?? [];
  const issues: ImportValidationIssue[] = [];

  rows.forEach((row, index) => {
    const missing = required.filter((field) => !String(row[field] ?? '').trim());
    if (missing.length) {
      issues.push({
        row: index + 2,
        message: `Faltan campos requeridos: ${missing.join(', ')}`
      });
    }
  });

  return {
    entity,
    validRows: rows.length - issues.length,
    invalidRows: issues.length,
    issues
  };
}
