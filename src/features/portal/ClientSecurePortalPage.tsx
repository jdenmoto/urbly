import { useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { validateClientPortalToken } from '@/lib/api/functions';
import { buildTechnicalReport } from '@/features/services/serviceReport';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';
import { useSearchParams } from 'react-router-dom';
import { formatServiceDateTime, getServiceOrderStatusLabel } from '@/features/services/serviceOrderPresentation';

const quoteStatusLabel: Record<string, string> = {
  draft: 'Borrador',
  pending_internal_review: 'En revisión interna',
  changes_requested: 'Ajustes solicitados',
  approved: 'Aprobada'
};

export default function ClientSecurePortalPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [validated, setValidated] = useState<null | { serviceOrderId: string; customerId: string }>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError('Token faltante.');
      return;
    }
    void validateClientPortalToken({ token })
      .then((result) => {
        if (cancelled || !result.valid) return;
        setValidated({ serviceOrderId: result.serviceOrderId, customerId: result.customerId });
      })
      .catch(() => {
        if (!cancelled) setError('Token inválido o expirado.');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const serviceOrder = serviceOrders.find((item) => item.id === validated?.serviceOrderId);

  const latestQuote = useMemo(
    () => serviceOrder?.quoteVersions.slice().sort((a, b) => b.version - a.version)[0] ?? null,
    [serviceOrder]
  );
  const latestTimeline = useMemo(
    () => (serviceOrder?.timeline?.length ? [...serviceOrder.timeline].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : []),
    [serviceOrder]
  );

  if (error) {
    return <EmptyState title="Portal de cliente" description={error} />;
  }

  if (!validated || !serviceOrder) {
    return <div className="p-8 text-sm text-ink-600">Validando acceso seguro...</div>;
  }

  const technicalReport = buildTechnicalReport(serviceOrder, t);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Portal seguro de cliente"
        subtitle="Consulta controlada de estado, cotización y reporte técnico del servicio compartido."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Estado actual" value={getServiceOrderStatusLabel(t, serviceOrder.status)} hint="Último estado visible" />
        <StatCard label="Novedades" value={serviceOrder.issues.length} hint="Incidencias registradas" />
        <StatCard label="Evidencia" value={serviceOrder.completionPhotos.length} hint="Fotos disponibles" />
        <StatCard label="Cotización" value={latestQuote ? `V${latestQuote.version}` : '—'} hint={latestQuote ? quoteStatusLabel[latestQuote.status] ?? latestQuote.status : 'Sin publicación'} />
      </section>

      <Card className="space-y-4 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Servicio compartido</h2>
            <p className="mt-1 text-sm text-ink-600">Resumen mínimo para ubicar el servicio y su avance visible.</p>
          </div>
          <div className="rounded-2xl bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="text-xs uppercase tracking-wide text-ink-500">Programado para</p>
            <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-ink-500">Servicio</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{serviceOrder.title}</p>
            <p className="mt-2 text-sm text-ink-600">{serviceOrder.description || 'Sin descripción ampliada.'}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-ink-500">Estado visible</p>
              <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
            </div>
            <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-ink-500">Última actualización</p>
              <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(latestTimeline[0]?.createdAt ?? serviceOrder.updatedAt ?? serviceOrder.scheduledStartAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Última cotización</h2>
            <p className="mt-1 text-sm text-ink-600">Versión más reciente publicada para consulta controlada.</p>
          </div>
          {latestQuote ? (
            <div className="rounded-2xl border border-fog-200 bg-white p-4 text-sm text-ink-700 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">Versión</p>
                  <p className="mt-1 font-semibold text-ink-900">{latestQuote.version}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">Estado</p>
                  <p className="mt-1 font-semibold text-ink-900">{quoteStatusLabel[latestQuote.status] ?? latestQuote.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">Monto</p>
                  <p className="mt-1 font-semibold text-ink-900">{latestQuote.amount} {latestQuote.currency}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">Creada</p>
                  <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(latestQuote.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">Alcance</p>
                <p className="mt-1 text-ink-700">{latestQuote.scope}</p>
                {latestQuote.notes ? <p className="mt-3 text-ink-600">{latestQuote.notes}</p> : null}
              </div>
            </div>
          ) : (
            <EmptyState title="Sin cotización" description="Todavía no hay una cotización publicada para este servicio." />
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">Trazabilidad visible</h2>
            <p className="mt-1 text-sm text-ink-600">Eventos compartidos y evidencia mínima disponible para este servicio.</p>
          </div>
          {latestTimeline.length ? (
            <div className="space-y-3">
              {latestTimeline.slice(0, 4).map((event) => (
                <div key={event.id} className="rounded-2xl border border-fog-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink-900">{event.summary}</p>
                      <p className="mt-1 text-sm text-ink-600">{event.actorRole === 'technician' ? 'Equipo técnico' : event.actorRole === 'company' ? 'Operación' : 'Sistema'}</p>
                    </div>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Sin trazabilidad ampliada" description="Este acceso seguro muestra solo la base mínima disponible para este servicio." />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-wide text-ink-500">Evidencia</p>
              <p className="mt-1 font-semibold text-ink-900">{serviceOrder.completionPhotos.length} fotos</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-wide text-ink-500">Novedades</p>
              <p className="mt-1 font-semibold text-ink-900">{serviceOrder.issues.length} registradas</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Reporte técnico</h2>
          <p className="mt-1 text-sm text-ink-600">Vista legible del informe consolidado para este servicio.</p>
        </div>
        <pre className="whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-sm text-ink-700">{technicalReport}</pre>
      </Card>
    </div>
  );
}
