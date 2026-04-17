import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { validateClientPortalToken } from '@/lib/api/functions';
import { useDoc } from '@/lib/api/queries';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { buildTechnicalReport } from '@/features/services/serviceOrderAi';
import { useI18n } from '@/lib/i18n';

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

  const { data: serviceOrder } = useDoc<ServiceOrder>('service_orders', validated?.serviceOrderId ?? '');

  if (error) {
    return <EmptyState title="Portal de cliente" description={error} />;
  }

  if (!validated || !serviceOrder) {
    return <div className="p-8 text-sm text-ink-600">Validando acceso seguro...</div>;
  }

  const latestQuote = serviceOrder.quoteVersions?.slice().sort((a, b) => b.version - a.version)[0];
  const technicalReport = buildTechnicalReport(serviceOrder, t);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Portal seguro de cliente" subtitle="Consulta controlada de cotizaciones y reportes" />
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Servicio</h2>
          <p className="text-sm text-ink-600">{serviceOrder.title}</p>
          <p className="text-sm text-ink-500">Estado: {serviceOrder.status}</p>
        </div>
      </Card>
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Última cotización</h2>
          {latestQuote ? (
            <div className="rounded-2xl border border-fog-200 p-4 text-sm text-ink-700">
              <p className="font-semibold text-ink-900">Versión {latestQuote.version}</p>
              <p>Estado: {latestQuote.status}</p>
              <p>Monto: {latestQuote.amount} {latestQuote.currency}</p>
              <p className="mt-2">{latestQuote.scope}</p>
              {latestQuote.notes ? <p className="mt-2 text-ink-600">{latestQuote.notes}</p> : null}
            </div>
          ) : (
            <EmptyState title="Sin cotización" description="Todavía no hay una cotización publicada para este servicio." />
          )}
        </div>
      </Card>
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Reporte técnico</h2>
          <pre className="whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-sm text-ink-700">{technicalReport}</pre>
        </div>
      </Card>
    </div>
  );
}
