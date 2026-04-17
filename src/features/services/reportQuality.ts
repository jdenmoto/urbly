import type { ServiceOrder } from '@/core/models/serviceOrder';

export type ReportQualityFinding = {
  severity: 'info' | 'warning' | 'critical';
  message: string;
};

export type ReportQualityAnalysis = {
  score: number;
  findings: ReportQualityFinding[];
};

export function analyzeReportQuality(serviceOrder: ServiceOrder): ReportQualityAnalysis {
  const findings: ReportQualityFinding[] = [];
  let score = 100;

  const observations = serviceOrder.report?.observations?.trim() ?? '';
  const issues = serviceOrder.issues?.length ?? 0;
  const attachments = serviceOrder.attachments?.length ?? 0;
  const photos = serviceOrder.completionPhotos?.length ?? 0;
  const checklist = Object.values(serviceOrder.report?.checklist ?? serviceOrder.checklist ?? {});
  const badChecklist = checklist.filter((item) => item === 'malo').length;

  if (!observations) {
    score -= 30;
    findings.push({ severity: 'critical', message: 'El reporte no tiene observaciones.' });
  }
  if (photos < 1) {
    score -= 20;
    findings.push({ severity: 'warning', message: 'No hay evidencia fotográfica registrada.' });
  }
  if (attachments < 1) {
    score -= 10;
    findings.push({ severity: 'info', message: 'No hay adjuntos complementarios cargados.' });
  }
  if (issues > 0 && !serviceOrder.review?.feedback) {
    score -= 15;
    findings.push({ severity: 'warning', message: 'Hay novedades detectadas sin feedback de revisión.' });
  }
  if (badChecklist > 0) {
    score -= 25;
    findings.push({ severity: 'critical', message: `Se detectaron ${badChecklist} ítems críticos en checklist.` });
  }

  if (!findings.length) {
    findings.push({ severity: 'info', message: 'El reporte base no muestra hallazgos críticos.' });
  }

  return { score: Math.max(score, 0), findings };
}
