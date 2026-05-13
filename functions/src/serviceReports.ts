import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { db } from './admin';

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

function formatChecklistLabel(key: string) {
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatChecklistValue(value: string) {
  if (value === 'ok') return 'OK';
  if (value === 'regular') return 'Regular';
  if (value === 'malo') return 'Malo';
  if (value === 'na') return 'N/A';
  return value;
}

export const generateServiceReportPdf = onCall(async (request) => {
  requireAuth(request.auth);
  const serviceOrderId = request.data?.serviceOrderId as string | undefined;
  if (!serviceOrderId) throw new HttpsError('invalid-argument', 'serviceOrderId es requerido.');

  const snap = await db.collection('service_orders').doc(serviceOrderId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Servicio no encontrado.');
  const serviceOrder = snap.data() as ServiceOrderData;

  await assertCanGenerateServiceReportPdf(request.auth, serviceOrder);

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
  draw(serviceOrder.title ?? 'Servicio', 14, true);
  draw(`Tipo: ${serviceOrder.type ?? 'N/A'}`);
  draw(`Estado: ${serviceOrder.status ?? 'N/A'}`);
  draw(`Inicio: ${formatDateTime(serviceOrder.scheduledStartAt)}`);
  draw(`Fin: ${formatDateTime(serviceOrder.scheduledEndAt)}`);
  draw(`Técnico: ${serviceOrder.assignedTechnicianId ?? 'Sin asignar'}`);
  draw('');
  draw('Descripción', 12, true);
  draw(String(serviceOrder.description ?? 'Sin descripción'));
  draw('');
  draw('Reporte operativo', 12, true);
  const report = (serviceOrder.report ?? {}) as Record<string, any>;
  draw(`Hora entrada: ${report.entryHour ?? 'N/A'}`);
  draw(`Hora salida: ${report.exitHour ?? 'N/A'}`);
  draw(`Observaciones: ${report.observations ?? 'Sin observaciones.'}`);
  const checklist = report.checklist && typeof report.checklist === 'object' ? report.checklist : {};
  const checklistEntries = Object.entries(checklist as Record<string, string>);
  if (!checklistEntries.length) {
    draw('Checklist: sin ítems registrados.');
  } else {
    draw('Checklist:', 11, true);
    for (const [key, value] of checklistEntries.slice(0, 20)) {
      draw(`• ${formatChecklistLabel(key)}: ${formatChecklistValue(String(value))}`, 10);
    }
  }
  draw('');
  draw('Novedades', 12, true);
  const issues = Array.isArray(serviceOrder.issues) ? serviceOrder.issues : [];
  if (!issues.length) {
    draw('Sin novedades registradas.');
  } else {
    for (const issue of issues.slice(0, 10)) {
      draw(`• ${issue.type ?? 'N/A'} / ${issue.category ?? 'N/A'}${issue.description ? `: ${issue.description}` : ''}`, 10);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return {
    filename: `ReporteTecnico_${serviceOrder.title ?? serviceOrderId}.pdf`,
    contentBase64: Buffer.from(pdfBytes).toString('base64')
  };
});
