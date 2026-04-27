import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { buildTechnicalReport } from './serviceOrderAi';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';

export default function ServiceReportPrintPage() {
  const { t } = useI18n();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const serviceOrder = useMemo(() => serviceOrders.find((item) => item.id === serviceOrderId) ?? null, [serviceOrders, serviceOrderId]);

  if (!serviceOrder) {
    return <EmptyState title="Vista imprimible" description="Servicio no encontrado." />;
  }

  const report = buildTechnicalReport(serviceOrder, t);

  return (
    <div className="mx-auto max-w-4xl space-y-6 bg-white p-8 text-slate-900">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">Reporte técnico imprimible</h1>
          <p className="text-sm text-slate-600">Versión de impresión para servicio y evidencias.</p>
        </div>
        <Button onClick={() => window.print()}>Imprimir</Button>
      </div>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">{serviceOrder.title}</h2>
        <p className="mt-1 text-sm text-slate-600">Estado: {serviceOrder.status}</p>
        <p className="text-sm text-slate-600">Ventana: {serviceOrder.scheduledStartAt} → {serviceOrder.scheduledEndAt}</p>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Reporte</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{report}</pre>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Adjuntos y evidencias</h2>
        {(serviceOrder.attachments.length || serviceOrder.completionPhotos.length) ? (
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-700">
            {serviceOrder.attachments.map((url, index) => <li key={`attachment-${index}`}>{url}</li>)}
            {serviceOrder.completionPhotos.map((url, index) => <li key={`photo-${index}`}>{url}</li>)}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Sin adjuntos registrados.</p>
        )}
      </section>
    </div>
  );
}
