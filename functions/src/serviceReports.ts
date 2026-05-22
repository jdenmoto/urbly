import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { db } from './admin';
import { buildServiceReportPdfModel, type TranslateFn } from './serviceReportPdfModel';

type AuthShape = { uid?: string; token?: Record<string, unknown> } | null | undefined;
type ServiceOrderData = Record<string, any>;
type AccountMemberData = Record<string, any>;

const INTERNAL_REPORT_ROLES = new Set([
  'owner',
  'admin',
  'editor',
  'supervisor',
  'scheduler',
  'operator',
  'auditoria'
]);
const CLIENT_REPORT_ROLES = new Set(['client', 'building_admin']);

function requireAuth(auth: AuthShape): asserts auth is NonNullable<AuthShape> & { uid: string } {
  if (!auth?.uid) throw new HttpsError('unauthenticated', 'Debe autenticarse.');
}

function getString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : null;
}

function getActiveAccountId(auth: AuthShape) {
  return getString(auth?.token?.activeAccountId);
}

function assertActiveServiceOrderAccount(auth: AuthShape, serviceOrder: ServiceOrderData) {
  const serviceOrderAccountId = getString(serviceOrder.accountId);
  const activeAccountId = getActiveAccountId(auth);
  if (!serviceOrderAccountId || activeAccountId !== serviceOrderAccountId) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }
  return serviceOrderAccountId;
}

async function getAccountMember(accountId: string, uid: string) {
  const memberSnap = await db.collection('accounts').doc(accountId).collection('members').doc(uid).get();
  if (!memberSnap.exists) {
    throw new HttpsError('permission-denied', 'No autorizado.');
  }
  return memberSnap.data() as AccountMemberData;
}

async function isLinkedEmployee(employeeId: string, auth: NonNullable<AuthShape>) {
  const employeeSnap = await db.collection('employees').doc(employeeId).get();
  if (!employeeSnap.exists) return false;

  const employee = employeeSnap.data() as Record<string, unknown>;
  const email = getString(auth.token?.email);
  return (
    employee.uid === auth.uid ||
    employee.userId === auth.uid ||
    employee.authUid === auth.uid ||
    (email !== null && employee.email === email)
  );
}

async function isAssignedTechnician(serviceOrder: ServiceOrderData, auth: NonNullable<AuthShape>) {
  const assignedTechnicianId = getString(serviceOrder.assignedTechnicianId);
  if (!assignedTechnicianId) return false;
  if (assignedTechnicianId === auth.uid) return true;
  return isLinkedEmployee(assignedTechnicianId, auth);
}

function matchesMemberField(member: AccountMemberData, field: string, expected: unknown) {
  const expectedValue = getString(expected);
  return expectedValue !== null && member[field] === expectedValue;
}

function isRelatedClient(serviceOrder: ServiceOrderData, member: AccountMemberData) {
  return (
    matchesMemberField(member, 'customerId', serviceOrder.customerId) ||
    matchesMemberField(member, 'managementCompanyId', serviceOrder.managementCompanyId) ||
    matchesMemberField(member, 'managementCompanyId', serviceOrder.administrationId) ||
    matchesMemberField(member, 'administrationId', serviceOrder.managementCompanyId) ||
    matchesMemberField(member, 'administrationId', serviceOrder.administrationId) ||
    matchesMemberField(member, 'buildingId', serviceOrder.buildingId)
  );
}

export function canGenerateServiceReportPdfForMember(args: {
  serviceOrder: ServiceOrderData;
  member: AccountMemberData;
  uid: string;
  linkedEmployee?: boolean;
}) {
  const { serviceOrder, member, uid, linkedEmployee = false } = args;
  const memberRole = getString(member.role);

  if (memberRole && INTERNAL_REPORT_ROLES.has(memberRole)) return true;

  if (memberRole === 'technician') {
    const assignedTechnicianId = getString(serviceOrder.assignedTechnicianId);
    return assignedTechnicianId !== null && (assignedTechnicianId === uid || linkedEmployee);
  }

  return Boolean(memberRole && CLIENT_REPORT_ROLES.has(memberRole) && isRelatedClient(serviceOrder, member));
}

async function assertCanGenerateServiceReportPdf(auth: AuthShape, serviceOrder: ServiceOrderData) {
  requireAuth(auth);
  const accountId = assertActiveServiceOrderAccount(auth, serviceOrder);
  const member = await getAccountMember(accountId, auth.uid);
  const memberRole = getString(member.role);
  const linkedEmployee = memberRole === 'technician'
    ? await isAssignedTechnician(serviceOrder, auth)
    : false;

  if (canGenerateServiceReportPdfForMember({ serviceOrder, member, uid: auth.uid, linkedEmployee })) return;

  throw new HttpsError('permission-denied', 'No autorizado.');
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

const pdfLabelDictionary: Record<string, string> = {
  'services.status.draft': 'Borrador',
  'services.status.unassigned': 'Sin asignar',
  'services.status.scheduled': 'Programado',
  'services.status.confirmed': 'Confirmado',
  'services.status.in.progress': 'En progreso',
  'services.status.paused': 'Pausado',
  'services.status.pending.review': 'Pendiente de revisión',
  'services.status.requires.reschedule': 'Requiere reprogramación',
  'services.status.completed': 'Completado',
  'services.status.cancelled': 'Cancelado',
  'services.priority.urgent': 'Urgente',
  'services.priority.high': 'Alta',
  'services.priority.medium': 'Media',
  'services.priority.low': 'Baja',
};

const pdfTranslate: TranslateFn = (key, params) => pdfLabelDictionary[key] ?? String(params?.defaultValue ?? key);

export const generateServiceReportPdf = onCall(async (request) => {
  requireAuth(request.auth);
  const serviceOrderId = request.data?.serviceOrderId as string | undefined;
  if (!serviceOrderId) throw new HttpsError('invalid-argument', 'serviceOrderId es requerido.');

  const snap = await db.collection('service_orders').doc(serviceOrderId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Servicio no encontrado.');
  const serviceOrder = snap.data() as ServiceOrderData;

  await assertCanGenerateServiceReportPdf(request.auth, serviceOrder);

  const reportModel = buildServiceReportPdfModel({ id: serviceOrderId, ...serviceOrder }, { t: pdfTranslate });
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 800;
  const draw = (text: string, size = 11, strong = false) => {
    page.drawText(text, { x: 40, y, size, font: strong ? bold : font });
    y -= size + 8;
  };

  draw('Reporte técnico base', 18, true);
  draw(reportModel.title || 'Servicio', 14, true);
  for (const [label, value] of reportModel.summaryRows) {
    const formattedValue = label === 'Inicio' || label === 'Fin' ? formatDateTime(value) : value;
    draw(`${label}: ${formattedValue || 'N/A'}`);
  }
  draw('');
  draw('Descripción', 12, true);
  draw(reportModel.description || 'Sin descripción');
  draw('');
  draw('Reporte operativo', 12, true);
  for (const [label, value] of reportModel.operationalRows) {
    draw(`${label}: ${value || (label === 'Observaciones' ? 'Sin observaciones.' : 'N/A')}`);
  }
  if (!reportModel.checklist.length) {
    draw('Checklist: sin ítems registrados.');
  } else {
    draw('Checklist:', 11, true);
    for (const item of reportModel.checklist.slice(0, 20)) {
      draw(`• ${item}`, 10);
    }
  }
  draw('');
  draw('Novedades', 12, true);
  if (!reportModel.issues.length) {
    draw('Sin novedades registradas.');
  } else {
    for (const issue of reportModel.issues.slice(0, 10)) {
      draw(`• ${issue}`, 10);
    }
  }
  if (reportModel.nextSteps.length) {
    draw('');
    draw('Siguientes pasos', 12, true);
    for (const step of reportModel.nextSteps.slice(0, 10)) {
      draw(`• ${step}`, 10);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    filename: `ReporteTecnico_${serviceOrder.title ?? serviceOrderId}.pdf`,
    contentBase64: Buffer.from(pdfBytes).toString('base64')
  };
});
