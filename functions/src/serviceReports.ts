import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { db } from './admin';

function requireAuth(auth: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!auth) throw new HttpsError('unauthenticated', 'Debe autenticarse.');
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
  const serviceOrder = snap.data() as Record<string, any>;

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
