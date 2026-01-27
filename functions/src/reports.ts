import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import PDFDocument from 'pdfkit';
import { db } from './admin';

function requireAuth(auth: { uid?: string; token?: Record<string, unknown> } | null | undefined) {
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Debe autenticarse.');
  }
}

export const generateAppointmentsPdf = onCall(async (request) => {
  requireAuth(request.auth);
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
  };

  const managementSnap = building.managementCompanyId
    ? await db.collection('management_companies').doc(building.managementCompanyId).get()
    : null;
  const management = managementSnap?.exists
    ? (managementSnap.data() as { name?: string; email?: string; contactPhone?: string })
    : null;

  const appointmentsSnap = await db
    .collection('appointments')
    .where('buildingId', '==', buildingId)
    .where('startAt', '>=', rangeStart)
    .where('startAt', '<', rangeEnd)
    .orderBy('startAt', 'asc')
    .get();

  const appointments = appointmentsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  logger.info('PDF appointments export', { count: appointments.length, buildingId });

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk as Buffer));

  doc.fontSize(18).text('Agendamientos', { align: 'left' });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#374151').text(`Administracion: ${management?.name ?? 'N/A'}`);
  doc.text(`Edificio: ${building.name ?? 'N/A'}`);
  doc.text(`Direccion: ${building.addressText ?? 'N/A'}`);
  doc.text(`Rango: ${rangeStart} - ${rangeEnd}`);
  doc.moveDown();

  doc.fillColor('#111827').fontSize(12).text('Listado de agendamientos', { underline: true });
  doc.moveDown(0.5);

  if (!appointments.length) {
    doc.text('No hay agendamientos en el rango seleccionado.');
  } else {
    appointments.forEach((item) => {
      const title = (item.title as string) ?? 'Sin titulo';
      const startAt = (item.startAt as string) ?? '';
      const endAt = (item.endAt as string) ?? '';
      const status = (item.status as string) ?? '';
      const type = (item.type as string) ?? '';
      doc
        .fontSize(11)
        .fillColor('#111827')
        .text(`${title} | ${type} | ${status}`, { continued: false });
      doc.fontSize(10).fillColor('#6B7280').text(`${startAt} - ${endAt}`);
      doc.moveDown(0.5);
    });
  }

  doc.end();

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  return {
    filename: `Agendamientos_${building.name ?? 'Edificio'}_${rangeStart.slice(0, 10)}.pdf`,
    contentBase64: pdfBuffer.toString('base64')
  };
});
