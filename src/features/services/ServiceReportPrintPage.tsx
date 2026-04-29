import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { buildTechnicalReport } from './serviceReport';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';
import { getServiceOrderStatusLabel } from './serviceOrderPresentation';

function getReportFlowTitle(status: string) {
  if (status === 'completed') return 'Reporte final del servicio';
  if (status === 'in_progress') return 'Borrador operativo del reporte';
  return 'Formato base de reporte';
}

function getReportFlowHint(status: string) {
  if (status === 'completed') return 'Salida final para impresión y revisión con evidencia consolidada.';
  if (status === 'in_progress') return 'Todavía puedes volver al cierre técnico para completar evidencia y observaciones antes de imprimir.';
  return 'Úsalo como referencia del entregable que quedará disponible al cerrar el servicio.';
}

function formatDateTime(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
}

type ServiceReportPrintLocationState = {
  fromPath?: string;
  fromDetail?: boolean;
  fromCloseout?: boolean;
  serviceStatus?: string;
};

function getBackToFlowLabel(locationState: ServiceReportPrintLocationState | null) {
  if (locationState?.fromPath?.startsWith('/technician')) return 'Volver al panel técnico';
  if (locationState?.fromCloseout) return 'Volver al cierre';
  if (locationState?.fromDetail) return 'Volver al detalle';
  return 'Volver al flujo';
}

export default function ServiceReportPrintPage() {
  const { t } = useI18n();
  const location = useLocation();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const serviceOrder = useMemo(() => serviceOrders.find((item) => item.id === serviceOrderId) ?? null, [serviceOrders, serviceOrderId]);
  const locationState = (location.state as ServiceReportPrintLocationState | null) ?? null;

  if (!serviceOrder) {
    return <EmptyState title="Vista imprimible" description="Servicio no encontrado." />;
  }

  const report = buildTechnicalReport(serviceOrder, t);

  const backTarget = locationState?.fromPath ?? `/services/${serviceOrder.id}/closeout`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 bg-white p-8 text-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold">{getReportFlowTitle(serviceOrder.status)}</h1>
          <p className="text-sm text-slate-600">{getReportFlowHint(serviceOrder.status)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={backTarget}
            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {getBackToFlowLabel(locationState)}
          </Link>
          <Button onClick={() => window.print()}>Imprimir</Button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold">{serviceOrder.title}</h2>
            <p className="mt-1 text-sm text-slate-600">Estado: {getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
            <p className="text-sm text-slate-600">Ventana: {formatDateTime(serviceOrder.scheduledStartAt)} → {formatDateTime(serviceOrder.scheduledEndAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Flujo services</p>
            <p>
              {locationState?.fromCloseout
                ? 'Llegaste desde cierre técnico. Si algo falta, vuelve al cierre antes de imprimir la versión final.'
                : locationState?.fromDetail
                  ? 'Llegaste desde detalle. Desde aquí puedes revisar el formato final y volver al cierre si aún falta evidencia.'
                  : 'Esta vista hace parte del flujo operativo principal de services.'}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Evidencia final</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{serviceOrder.completionPhotos.length}</p>
          <p className="text-sm text-slate-600">fotos registradas</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Novedades</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{serviceOrder.issues.length}</p>
          <p className="text-sm text-slate-600">hallazgos documentados</p>
        </div>
        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Adjuntos</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{serviceOrder.attachments.length}</p>
          <p className="text-sm text-slate-600">documentos asociados</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Reporte</h2>
        <pre className="mt-4 whitespace-pre-wrap text-sm text-slate-800">{report}</pre>
      </section>

      <section className="rounded-2xl border border-slate-200 p-6">
        <h2 className="text-lg font-semibold">Adjuntos y evidencias</h2>
        {(serviceOrder.attachments.length || serviceOrder.completionPhotos.length) ? (
          <div className="mt-4 space-y-5">
            {serviceOrder.completionPhotos.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">Fotos de cierre</p>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {serviceOrder.completionPhotos.map((url, index) => (
                    <a key={`photo-${index}`} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-xl border border-slate-200">
                      <img src={url} alt={`Foto cierre ${index + 1}`} className="h-24 w-full object-cover" loading="lazy" />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            {serviceOrder.attachments.length ? (
              <div>
                <p className="text-sm font-semibold text-slate-800">Adjuntos</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {serviceOrder.attachments.map((url, index) => (
                    <li key={`attachment-${index}`}>
                      <a href={url} target="_blank" rel="noreferrer" className="underline">Adjunto {index + 1}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">Sin adjuntos registrados.</p>
        )}
      </section>
    </div>
  );
}
