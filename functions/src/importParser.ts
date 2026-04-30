import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file/node';

export type ParsedImportFile = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export async function parseImportWorkbook(args: { arrayBuffer: ArrayBuffer; fileName: string }): Promise<ParsedImportFile> {
  const { arrayBuffer, fileName } = args;
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const csv = Buffer.from(arrayBuffer).toString('utf8');
    const parsed = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true
    });
    const headers = parsed.meta.fields ?? [];
    const rows = parsed.data.map((row) => {
      return headers.reduce<Record<string, string>>((entry, header) => {
        entry[header] = String(row[header] ?? '');
        return entry;
      }, {});
    });
    return { headers, rows };
  }

  const sheets = await readXlsxFile(Buffer.from(arrayBuffer));
  const sheetRows = sheets[0]?.data ?? [];
  const [headerRow, ...bodyRows] = sheetRows;
  if (!headerRow) {
    return { headers: [], rows: [] };
  }

  const headers = headerRow.map((cell) => String(cell ?? '').trim());
  const rows = bodyRows.reduce<Array<Record<string, string>>>((entries, row) => {
    const entry: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const value = row[idx];
      entry[header] = value ? String(value) : '';
    });
    if (Object.values(entry).some((value) => value.trim())) {
      entries.push(entry);
    }
    return entries;
  }, []);

  return { headers, rows };
}
