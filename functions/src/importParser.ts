import ExcelJS from 'exceljs';
import { Readable } from 'stream';

export type ParsedImportFile = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

export async function parseImportWorkbook(args: { arrayBuffer: ArrayBuffer; fileName: string }): Promise<ParsedImportFile> {
  const { arrayBuffer, fileName } = args;
  const workbook = new ExcelJS.Workbook();
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    const csvBuffer = Buffer.from(arrayBuffer);
    await workbook.csv.read(Readable.from([csvBuffer]));
  } else {
    await workbook.xlsx.load(arrayBuffer);
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  const headerRow = worksheet.getRow(1);
  const headers = Array.from({ length: headerRow.cellCount }, (_, index) => {
    const cell = headerRow.getCell(index + 1).value;
    return String(cell ?? '').trim();
  });

  const rows: Array<Record<string, string>> = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const entry: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const value = row.getCell(idx + 1).value;
      entry[header] = value ? String(value) : '';
    });
    rows.push(entry);
  });

  return { headers, rows };
}
