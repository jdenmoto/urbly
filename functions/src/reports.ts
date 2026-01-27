import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import ExcelJS from 'exceljs';
import { db } from './admin';
import fs from 'node:fs';
import path from 'node:path';

function requireAuth(auth: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }
}

type TemplatePlaceholder = {
  placeholder: string;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
};

const templateCache = new Map<string, Promise<TemplatePlaceholder[]>>();

const excelColumnWidthToPoints = (width: number) => {
  const pixels = Math.floor(width * 7 + 5);
  return (pixels * 72) / 96;
};

const parseCellAddress = (address: string) => {
  const match = address.match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return { col: 1, row: 1 };
  }
  const [, letters, rowStr] = match;
  let col = 0;
  for (let i = 0; i < letters.length; i += 1) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return { col, row: Number(rowStr) };
};

const parseRange = (range: string) => {
  const [start, end] = range.split(':');
  const startCell = parseCellAddress(start);
  const endCell = parseCellAddress(end);
  return {
    startCol: startCell.col,
    startRow: startCell.row,
    endCol: endCell.col,
    endRow: endCell.row
  };
};

const getMergeRanges = (worksheet: ExcelJS.Worksheet) => {
  const merges = worksheet.model.merges ?? [];
  return merges.map((range) => parseRange(range));
};

const findMergeForCell = (
  merges: ReturnType<typeof getMergeRanges>,
  row: number,
  col: number
) => merges.find((merge) => row >= merge.startRow && row <= merge.endRow && col >= merge.startCol && col <= merge.endCol);

const loadTemplateMap = async (
  templateExcelPath: string,
  pageSize: { width: number; height: number }
) => {
  if (templateCache.has(templateExcelPath)) {
    return templateCache.get(templateExcelPath) as Promise<TemplatePlaceholder[]>;
  }
  const promise = (async () => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templateExcelPath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      return [];
    }
    const margins = worksheet.pageSetup?.margins ?? {
      left: 0.4,
      right: 0.4,
      top: 0.4,
      bottom: 0.4
    };
    const leftMargin = margins.left * 72;
    const topMargin = margins.top * 72;
    const defaultColumnWidth = 8.43;
    const defaultRowHeight = 15;

    const colWidths: number[] = [];
    for (let i = 1; i <= worksheet.columnCount; i += 1) {
      const width = worksheet.getColumn(i).width ?? defaultColumnWidth;
      colWidths[i] = excelColumnWidthToPoints(width);
    }

    const rowHeights: number[] = [];
    for (let i = 1; i <= worksheet.rowCount; i += 1) {
      const height = worksheet.getRow(i).height ?? defaultRowHeight;
      rowHeights[i] = height;
    }

    const merges = getMergeRanges(worksheet);
    const placeholders: TemplatePlaceholder[] = [];
    const seen = new Set<string>();

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const value = cell.value;
        if (typeof value !== 'string' || !value.includes('{') || !value.includes('}')) return;
        const matches = value.match(/\{[^}]+\}/g) ?? [];
        const merge = findMergeForCell(merges, rowNumber, colNumber);
        if (merge && (rowNumber !== merge.startRow || colNumber !== merge.startCol)) {
          return;
        }
        const startCol = merge?.startCol ?? colNumber;
        const endCol = merge?.endCol ?? colNumber;
        const startRow = merge?.startRow ?? rowNumber;
        const endRow = merge?.endRow ?? rowNumber;

        const keyPrefix = `${startRow}-${startCol}-${endRow}-${endCol}`;
        matches.forEach((placeholder) => {
          const key = `${placeholder}:${keyPrefix}`;
          if (seen.has(key)) return;
          seen.add(key);

          let x = leftMargin;
          for (let i = 1; i < startCol; i += 1) {
            x += colWidths[i] ?? 0;
          }
          let maxWidth = 0;
          for (let i = startCol; i <= endCol; i += 1) {
            maxWidth += colWidths[i] ?? 0;
          }
          let yTop = pageSize.height - topMargin;
          for (let i = 1; i < startRow; i += 1) {
            yTop -= rowHeights[i] ?? 0;
          }
          let cellHeight = 0;
          for (let i = startRow; i <= endRow; i += 1) {
            cellHeight += rowHeights[i] ?? 0;
          }
          const y = yTop - cellHeight * 0.7;
          placeholders.push({
            placeholder,
            x: x + 2,
            y,
            maxWidth: Math.max(maxWidth - 4, 4),
            fontSize: 8
          });
        });
      });
    });
    return placeholders;
  })();

  templateCache.set(templateExcelPath, promise);
  return promise;
};

export const generateAppointmentsPdf = onCall(async (request) => {
  requireAuth(request.auth);
  const role = request.auth?.token?.role as string | undefined;
  if (!role || !['admin', 'editor', 'view', 'building_admin'].includes(role)) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }
  const buildingId = request.data?.buildingId as string | undefined;
  const rangeStart = request.data?.rangeStart as string | undefined;
  const rangeEnd = request.data?.rangeEnd as string | undefined;

  if (!buildingId || !rangeStart || !rangeEnd) {
    throw new HttpsError('invalid-argument', 'Parametros invalidos.');
  }

  const buildingSnap = await db.collection('buildings').doc(buildingId).get();
  if (!buildingSnap.exists) {
    throw new HttpsError('not-found', 'Edificio no encontrado.');
  }
  const building = buildingSnap.data() as {
    name?: string;
    managementCompanyId?: string;
    addressText?: string;
    type?: string;
    nit?: string;
    contractId?: string;
  };
  if (role === 'building_admin') {
    const adminId = request.auth?.token?.administrationId as string | undefined;
    if (!adminId || building.managementCompanyId !== adminId) {
      throw new HttpsError('permission-denied', 'No autorizado.');
    }
  }

  const managementSnap = building.managementCompanyId
    ? await db.collection('management_companies').doc(building.managementCompanyId).get()
    : null;
  const management = managementSnap?.exists
    ? (managementSnap.data() as { name?: string; email?: string; contactPhone?: string; nit?: string })
    : null;

  type ContractDoc = {
    maintenanceTypeName?: string;
    maintenancePrices?: Record<string, number>;
    labAnalysisTypeName?: string;
    labAnalysisPrice?: number;
    endAt?: string;
    administrationId?: string;
  };

  let contract: ContractDoc | null = null;

  if (building.contractId) {
    const contractSnap = await db.collection('contracts').doc(building.contractId).get();
    if (contractSnap.exists) {
      contract = contractSnap.data() as ContractDoc;
    }
  }

  if (!contract && building.managementCompanyId) {
    const contractsSnap = await db
      .collection('contracts')
      .where('administrationId', '==', building.managementCompanyId)
      .where('status', '==', 'activo')
      .limit(1)
      .get();
    const doc = contractsSnap.docs[0];
    if (doc) {
      contract = doc.data() as ContractDoc;
    }
  }

  const appointmentsSnap = await db
    .collection('appointments')
    .where('buildingId', '==', buildingId)
    .where('startAt', '>=', rangeStart)
    .where('startAt', '<', rangeEnd)
    .orderBy('startAt', 'asc')
    .get();

  const appointments = appointmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{
    id: string;
    title?: string;
    startAt?: string;
    endAt?: string;
    status?: string;
    type?: string;
  }>;
  logger.info('PDF appointments export', { count: appointments.length, buildingId });

  const templatePath = path.resolve(process.cwd(), 'assets', 'template.pdf');
  const templateExcelPath = path.resolve(process.cwd(), 'assets', 'template_excel.xlsx');
  if (!fs.existsSync(templateExcelPath)) {
    throw new HttpsError('internal', 'Plantilla Excel no encontrada.');
  }
  if (!fs.existsSync(templatePath)) {
    throw new HttpsError('internal', 'Plantilla PDF no encontrada.');
  }
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const textColor = rgb(0.1, 0.1, 0.1);

  const parseDate = (value?: unknown) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    if (typeof value === 'object' && value && 'toDate' in value) {
      const toDate = (value as { toDate?: () => Date }).toDate;
      return toDate ? toDate() : null;
    }
    return null;
  };

  const formatDate = (value?: unknown) => {
    const date = parseDate(value);
    if (!date) return '';
    return date.toLocaleDateString('es-CO');
  };

  const formatCOP = (value?: number) => {
    if (!Number.isFinite(value ?? NaN)) return '';
    return `$${Math.round(value ?? 0).toLocaleString('es-CO')}`;
  };

  const appointmentDatesByMonth = new Map<number, Date>();
  appointments.forEach((item) => {
    const date = parseDate(item.startAt);
    if (!date) return;
    const month = date.getMonth();
    if (!appointmentDatesByMonth.has(month)) {
      appointmentDatesByMonth.set(month, date);
    }
  });

  const findAppointmentByKeyword = (keywords: string[]) => {
    const item = appointments.find((appointment) => {
      const type = (appointment.type ?? '').toString().toLowerCase();
      return keywords.every((keyword) => type.includes(keyword));
    });
    return item ? formatDate(item.startAt) : '';
  };

  const placeholderValues: Record<string, string> = {
    '{tipo_edificio}': building.type ?? '',
    '{fecha_generacion}': formatDate(new Date()),
    '{nombre_edificio}': building.name ?? '',
    '{nit_edificio}': building.nit ?? '',
    '{direccion_edificio}': building.addressText ?? '',
    '{telefono_administracion}': management?.contactPhone ?? '',
    '{nombre_administracion}': management?.name ?? '',
    '{tipo_contrato_mantenimiento}': contract?.maintenanceTypeName ?? '',
    '{fecha_finalizacion_contrato_mantenimiento}': formatDate(contract?.endAt),
    '{contrato_analisis_lab_tipo}': contract?.labAnalysisTypeName ?? '',
    '{valor_contrato_mantenimiento}': formatCOP(
      contract?.maintenancePrices?.valor_contrato_mantenimiento
    ),
    '{valor_analisis_laboratiorio_tipo}': formatCOP(contract?.labAnalysisPrice),
    '{valor_lavado_tanque_agua_potable_sem1}': formatCOP(
      contract?.maintenancePrices?.valor_lavado_tanque_agua_potable_sem1
    ),
    '{valor_lavado_tanque_agua_potable_sem2}': formatCOP(
      contract?.maintenancePrices?.valor_lavado_tanque_agua_potable_sem2
    ),
    '{valor_lavado_pozos_eyectores_aguas_lluvias}': formatCOP(
      contract?.maintenancePrices?.valor_lavado_pozos_eyectores_aguas_lluvias
    ),
    '{valor_lavado_pozos_eyectores_aguas_negras}': formatCOP(
      contract?.maintenancePrices?.valor_lavado_pozos_eyectores_aguas_negras
    ),
    '{valor_pruebas_hidraulias_red_contra_incendios}': formatCOP(
      contract?.maintenancePrices?.valor_pruebas_hidraulias_red_contra_incendios
    ),
    '{valor_limpieza_sistema_drenaje_sotanos}': formatCOP(
      contract?.maintenancePrices?.valor_limpieza_sistema_drenaje_sotanos
    ),
    '{valor_lavado_tanque_red_contra_incendios}': formatCOP(
      contract?.maintenancePrices?.valor_lavado_tanque_red_contra_incendios
    ),
    '{fecha_rec_agua_potable_1}': findAppointmentByKeyword(['agua', 'potable', '1']),
    '{fecha_rec_agua_potable_2}': findAppointmentByKeyword(['agua', 'potable', '2']),
    '{fecha_rec_pozo_aguas_lluvias}': findAppointmentByKeyword(['pozo', 'lluvia']),
    '{fecha_rec_pozo_aguas_negras}': findAppointmentByKeyword(['pozo', 'negra']),
    '{fecha_rec_tanque_rci}': findAppointmentByKeyword(['tanque', 'rci']),
    '{fecha_rec_pruebas_rci}': findAppointmentByKeyword(['pruebas', 'rci'])
  };

  const monthKeys: Array<[number, string]> = [
    [0, '{dia_mes_enero}'],
    [1, '{dia_mes_febrero}'],
    [2, '{dia_mes_marzo}'],
    [3, '{dia_mes_abril}'],
    [4, '{dia_mes_mayo}'],
    [5, '{dia_mes_junio}'],
    [6, '{dia_mes_julio}'],
    [7, '{dia_mes_agosto}'],
    [8, '{dia_mes_septiembre}'],
    [9, '{dia_mes_octubre}'],
    [10, '{dia_mes_noviembre}'],
    [11, '{dia_mes_diciembre}']
  ];

  monthKeys.forEach(([monthIndex, key]) => {
    const date = appointmentDatesByMonth.get(monthIndex);
    placeholderValues[key] = date ? String(date.getDate()) : '';
  });

  const draw = (text: string, x: number, y: number, size: number, maxWidth: number) => {
    let fontSize = size;
    const cleanText = text ?? '';
    if (!cleanText) return;
    while (font.widthOfTextAtSize(cleanText, fontSize) > maxWidth && fontSize > 6) {
      fontSize -= 0.5;
    }
    let finalText = cleanText;
    if (font.widthOfTextAtSize(finalText, fontSize) > maxWidth) {
      while (finalText.length > 1 && font.widthOfTextAtSize(`${finalText}…`, fontSize) > maxWidth) {
        finalText = finalText.slice(0, -1);
      }
      finalText = `${finalText}…`;
    }
    page.drawText(finalText, { x, y, size: fontSize, font, color: textColor });
  };

  const templateMap = await loadTemplateMap(templateExcelPath, { width, height });
  templateMap.forEach((item) => {
    const value = placeholderValues[item.placeholder] ?? '';
    draw(value, item.x, item.y, item.fontSize, item.maxWidth);
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return {
    filename: `Agendamientos_${building.name ?? 'Edificio'}_${rangeStart.slice(0, 10)}.pdf`,
    contentBase64: pdfBuffer.toString('base64')
  };
});
