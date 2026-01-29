import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { db } from './admin';
import fs from 'node:fs';
import path from 'node:path';

function requireAuth(auth: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }
}

const toDate = (value?: unknown) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value && 'toDate' in value) {
    const toDateFn = (value as { toDate?: () => Date }).toDate;
    return toDateFn ? toDateFn() : null;
  }
  return null;
};

const formatDate = (value?: unknown) => {
  const date = toDate(value);
  if (!date) return '';
  return date.toLocaleDateString('es-CO');
};

const formatCOP = (value?: number) => {
  if (!Number.isFinite(value ?? NaN)) return '';
  if (!value) return 'N/A';
  return `$${Math.round(value ?? 0).toLocaleString('es-CO')}`;
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
    maintenanceApplies?: Record<string, boolean>;
    maintenanceRecommendedDates?: {
      fecha_rec_agua_potable_1?: string;
      fecha_rec_agua_potable_2?: string;
      fecha_rec_pozo_aguas_lluvias?: string;
      fecha_rec_pozo_aguas_negras?: string;
      fecha_rec_tanque_rci?: string;
      fecha_rec_pruebas_rci?: string;
    };
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

  const reportYear = new Date(rangeStart).getFullYear();
  const maintenanceSnap = await db
    .collection('appointments')
    .where('buildingId', '==', buildingId)
    .orderBy('startAt', 'asc')
    .get();
  const maintenanceAppointments = maintenanceSnap.docs
    .map((doc) => ({ id: doc.id, ...doc.data() })) as Array<{
      id: string;
      startAt?: string;
      type?: string;
    }>;
  const maintenanceForYear = maintenanceAppointments.filter((item) => {
    if ((item.type ?? '').toString().toLowerCase() !== 'mantenimiento') return false;
    const date = toDate(item.startAt);
    return date ? date.getFullYear() === reportYear : false;
  });
  logger.info('PDF maintenance dates export', {
    count: maintenanceForYear.length,
    buildingId,
    reportYear
  });

  const templatePath = path.resolve(process.cwd(), 'assets', 'template_sin_datos.pdf');
  if (!fs.existsSync(templatePath)) {
    throw new HttpsError('internal', 'Plantilla PDF no encontrada.');
  }
  const templateBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(templateBytes);

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
    '{valor_contrato_mantenimiento}':
      contract?.maintenanceApplies?.valor_contrato_mantenimiento === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_contrato_mantenimiento),
    '{valor_analisis_laboratiorio_tipo}': formatCOP(contract?.labAnalysisPrice),
    '{valor_lavado_tanque_agua_potable_sem1}':
      contract?.maintenanceApplies?.valor_lavado_tanque_agua_potable_sem1 === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_lavado_tanque_agua_potable_sem1),
    '{valor_lavado_tanque_agua_potable_sem2}':
      contract?.maintenanceApplies?.valor_lavado_tanque_agua_potable_sem2 === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_lavado_tanque_agua_potable_sem2),
    '{valor_lavado_pozos_eyectores_aguas_lluvias}':
      contract?.maintenanceApplies?.valor_lavado_pozos_eyectores_aguas_lluvias === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_lavado_pozos_eyectores_aguas_lluvias),
    '{valor_lavado_pozos_eyectores_aguas_negras}':
      contract?.maintenanceApplies?.valor_lavado_pozos_eyectores_aguas_negras === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_lavado_pozos_eyectores_aguas_negras),
    '{valor_pruebas_hidraulicas_red_contra_incendios}':
      contract?.maintenanceApplies?.valor_pruebas_hidraulicas_red_contra_incendios === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_pruebas_hidraulicas_red_contra_incendios),
    '{valor_limpieza_sistema_drenaje_sotanos}':
      contract?.maintenanceApplies?.valor_limpieza_sistema_drenaje_sotanos === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_limpieza_sistema_drenaje_sotanos),
    '{valor_lavado_tanque_red_contra_incendios}':
      contract?.maintenanceApplies?.valor_lavado_tanque_red_contra_incendios === false
        ? 'N/A'
        : formatCOP(contract?.maintenancePrices?.valor_lavado_tanque_red_contra_incendios),
    '{fecha_rec_agua_potable_1}': '',
    '{fecha_rec_agua_potable_2}': '',
    '{fecha_rec_pozo_aguas_lluvias}': '',
    '{fecha_rec_pozo_aguas_negras}': '',
    '{fecha_rec_tanque_rci}': '',
    '{fecha_rec_pruebas_rci}': '',
    '{anho_anterior}': String(new Date().getFullYear() - 1),
    '{anho_actual}': String(new Date().getFullYear())
  };

  const maintenanceDatesByMonth = new Map<number, Date>();
  maintenanceForYear.forEach((item) => {
    const date = toDate(item.startAt);
    if (!date) return;
    const month = date.getMonth();
    if (!maintenanceDatesByMonth.has(month)) {
      maintenanceDatesByMonth.set(month, date);
    }
  });

  const monthPlaceholders: Array<[number, string]> = [
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

  monthPlaceholders.forEach(([month, key]) => {
    const date = maintenanceDatesByMonth.get(month);
    placeholderValues[key] = date ? String(date.getDate()).padStart(2, '0') : '';
  });

  if (contract?.maintenanceRecommendedDates) {
    placeholderValues['{fecha_rec_agua_potable_1}'] = formatDate(contract.maintenanceRecommendedDates.fecha_rec_agua_potable_1);
    placeholderValues['{fecha_rec_agua_potable_2}'] = formatDate(contract.maintenanceRecommendedDates.fecha_rec_agua_potable_2);
    placeholderValues['{fecha_rec_pozo_aguas_lluvias}'] = formatDate(
      contract.maintenanceRecommendedDates.fecha_rec_pozo_aguas_lluvias
    );
    placeholderValues['{fecha_rec_pozo_aguas_negras}'] = formatDate(
      contract.maintenanceRecommendedDates.fecha_rec_pozo_aguas_negras
    );
    placeholderValues['{fecha_rec_tanque_rci}'] = formatDate(
      contract.maintenanceRecommendedDates.fecha_rec_tanque_rci
    );
    placeholderValues['{fecha_rec_pruebas_rci}'] = formatDate(
      contract.maintenanceRecommendedDates.fecha_rec_pruebas_rci
    );
  }

  const form = pdfDoc.getForm();
  Object.entries(placeholderValues).forEach(([key, value]) => {
    const fieldName = key.replace(/[{}]/g, '');
    try {
      const field = form.getTextField(fieldName);
      field.setText(value ?? 'error');
    } catch (error) {
      logger.debug('PDF field not found', { fieldName });
    }
  });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  form.updateFieldAppearances(font);
  form.flatten();

  const pdfBytes = await pdfDoc.save();
  const pdfBuffer = Buffer.from(pdfBytes);

  return {
    filename: `Agendamientos_${building.name ?? 'Edificio'}_${rangeStart.slice(0, 10)}.pdf`,
    contentBase64: pdfBuffer.toString('base64')
  };
});
