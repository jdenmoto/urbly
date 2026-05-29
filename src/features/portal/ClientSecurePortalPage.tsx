import { type FormEvent, useEffect, useMemo, useState } from 'react';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { createClientPortalServiceRequest, validateClientPortalToken } from '@/lib/api/functions';
import { buildTechnicalReport } from '@/features/services/serviceReport';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';
import { useSearchParams } from 'react-router-dom';
import { formatServiceDateTime, getServiceOrderStatusLabel } from '@/features/services/serviceOrderPresentation';

const requestPriorityValues = ['medium', 'high', 'urgent', 'low'] as const;

export default function ClientSecurePortalPage() {
  const { t } = useI18n();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [validated, setValidated] = useState<null | { serviceOrderId: string; customerId: string }>(null);
  const [error, setError] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [requestDescription, setRequestDescription] = useState('');
  const [requestPriority, setRequestPriority] = useState<(typeof requestPriorityValues)[number]>('medium');
  const [requestedForAt, setRequestedForAt] = useState('');
  const [requestStatus, setRequestStatus] = useState<{ kind: 'idle' | 'submitting' | 'success' | 'error'; message?: string }>({ kind: 'idle' });

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setError(t('client.portal.secure.error.token.missing'));
      return;
    }
    void validateClientPortalToken({ token })
      .then((result) => {
        if (cancelled || !result.valid) return;
        setValidated({ serviceOrderId: result.serviceOrderId, customerId: result.customerId });
      })
      .catch(() => {
        if (!cancelled) setError(t('client.portal.secure.error.token.invalid'));
      });
    return () => {
      cancelled = true;
    };
  }, [token, t]);

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

  async function submitClientRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestStatus({ kind: 'submitting', message: t('client.portal.secure.request.submitting.message') });
    try {
      const result = await createClientPortalServiceRequest({
        token,
        title: requestTitle,
        description: requestDescription,
        priority: requestPriority,
        requestedForAt: requestedForAt ? new Date(requestedForAt).toISOString() : undefined
      });
      setRequestStatus({ kind: 'success', message: t('client.portal.secure.request.success', { id: result.serviceOrderId }) });
      setRequestTitle('');
      setRequestDescription('');
      setRequestPriority('medium');
      setRequestedForAt('');
    } catch {
      setRequestStatus({ kind: 'error', message: t('client.portal.secure.request.error') });
    }
  }

  if (error) {
    return <EmptyState title={t('client.portal.secure.title')} description={error} />;
  }

  if (!validated || !serviceOrder) {
    return <div className="p-8 text-sm text-ink-600">{t('client.portal.secure.validating')}</div>;
  }

  const technicalReport = buildTechnicalReport(serviceOrder, t);
  const quoteStatusLabel: Record<string, string> = {
    draft: t('client.portal.secure.quote.status.draft'),
    pending_internal_review: t('client.portal.secure.quote.status.pending.internal.review'),
    changes_requested: t('client.portal.secure.quote.status.changes.requested'),
    approved: t('client.portal.secure.quote.status.approved')
  };
  const requestPriorityOptions = requestPriorityValues.map((value) => ({
    value,
    label: t(`client.portal.secure.request.priority.${value}`)
  }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t('client.portal.secure.title')}
        subtitle={t('client.portal.secure.subtitle')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t('client.portal.secure.metrics.status.label')} value={getServiceOrderStatusLabel(t, serviceOrder.status)} hint={t('client.portal.secure.metrics.status.hint')} />
        <StatCard label={t('client.portal.secure.metrics.issues.label')} value={serviceOrder.issues.length} hint={t('client.portal.secure.metrics.issues.hint')} />
        <StatCard label={t('client.portal.secure.metrics.evidence.label')} value={serviceOrder.completionPhotos.length} hint={t('client.portal.secure.metrics.evidence.hint')} />
        <StatCard label={t('client.portal.secure.metrics.quote.label')} value={latestQuote ? `V${latestQuote.version}` : '—'} hint={latestQuote ? quoteStatusLabel[latestQuote.status] ?? latestQuote.status : t('client.portal.secure.metrics.quote.empty')} />
      </section>

      <Card className="space-y-4 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('client.portal.secure.shared.service.title')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('client.portal.secure.shared.service.subtitle')}</p>
          </div>
          <div className="rounded-2xl bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.shared.service.scheduled.for')}</p>
            <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
          <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.shared.service.service.label')}</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{serviceOrder.title}</p>
            <p className="mt-2 text-sm text-ink-600">{serviceOrder.description || t('client.portal.secure.shared.service.no.description')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.shared.service.visible.status')}</p>
              <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, serviceOrder.status)}</p>
            </div>
            <div className="rounded-3xl border border-fog-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.shared.service.last.update')}</p>
              <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(latestTimeline[0]?.createdAt ?? serviceOrder.updatedAt ?? serviceOrder.scheduledStartAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('client.portal.secure.request.title')}</h2>
          <p className="mt-1 text-sm text-ink-600">
            {t('client.portal.secure.request.subtitle')}
          </p>
        </div>
        <form className="grid gap-4 lg:grid-cols-[1fr,0.35fr]" onSubmit={submitClientRequest}>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-ink-700" htmlFor="client-request-title">
              {t('client.portal.secure.request.fields.title.label')}
            </label>
            <input
              id="client-request-title"
              className="w-full rounded-2xl border border-fog-200 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-slate-400"
              value={requestTitle}
              onChange={(event) => setRequestTitle(event.target.value)}
              maxLength={120}
              placeholder={t('client.portal.secure.request.fields.title.placeholder')}
            />
            <label className="block text-sm font-semibold text-ink-700" htmlFor="client-request-description">
              {t('client.portal.secure.request.fields.description.label')}
            </label>
            <textarea
              id="client-request-description"
              className="min-h-28 w-full rounded-2xl border border-fog-200 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-slate-400"
              value={requestDescription}
              onChange={(event) => setRequestDescription(event.target.value)}
              maxLength={1200}
              placeholder={t('client.portal.secure.request.fields.description.placeholder')}
            />
          </div>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-ink-700" htmlFor="client-request-priority">
              {t('client.portal.secure.request.fields.priority')}
            </label>
            <select
              id="client-request-priority"
              className="w-full rounded-2xl border border-fog-200 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-slate-400"
              value={requestPriority}
              onChange={(event) => setRequestPriority(event.target.value as typeof requestPriority)}
            >
              {requestPriorityOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <label className="block text-sm font-semibold text-ink-700" htmlFor="client-request-date">
              {t('client.portal.secure.request.fields.suggested.date')}
            </label>
            <input
              id="client-request-date"
              type="datetime-local"
              className="w-full rounded-2xl border border-fog-200 px-4 py-3 text-sm text-ink-900 outline-none transition focus:border-slate-400"
              value={requestedForAt}
              onChange={(event) => setRequestedForAt(event.target.value)}
            />
            <button
              type="submit"
              disabled={requestStatus.kind === 'submitting'}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requestStatus.kind === 'submitting' ? t('client.portal.secure.request.submitting.short') : t('client.portal.secure.request.submit')}
            </button>
            {requestStatus.message ? (
              <p className={`rounded-2xl p-3 text-sm ${requestStatus.kind === 'error' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {requestStatus.message}
              </p>
            ) : null}
          </div>
        </form>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr,1.05fr]">
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('client.portal.secure.quote.title')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('client.portal.secure.quote.subtitle')}</p>
          </div>
          {latestQuote ? (
            <div className="rounded-2xl border border-fog-200 bg-white p-4 text-sm text-ink-700 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.quote.fields.version')}</p>
                  <p className="mt-1 font-semibold text-ink-900">{latestQuote.version}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.quote.fields.status')}</p>
                  <p className="mt-1 font-semibold text-ink-900">{quoteStatusLabel[latestQuote.status] ?? latestQuote.status}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.quote.fields.amount')}</p>
                  <p className="mt-1 font-semibold text-ink-900">{latestQuote.amount} {latestQuote.currency}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.quote.fields.created')}</p>
                  <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(latestQuote.createdAt)}</p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.quote.fields.scope')}</p>
                <p className="mt-1 text-ink-700">{latestQuote.scope}</p>
                {latestQuote.notes ? <p className="mt-3 text-ink-600">{latestQuote.notes}</p> : null}
              </div>
            </div>
          ) : (
            <EmptyState title={t('client.portal.secure.quote.empty.title')} description={t('client.portal.secure.quote.empty.description')} />
          )}
        </Card>

        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('client.portal.secure.traceability.title')}</h2>
            <p className="mt-1 text-sm text-ink-600">{t('client.portal.secure.traceability.subtitle')}</p>
          </div>
          {latestTimeline.length ? (
            <div className="space-y-3">
              {latestTimeline.slice(0, 4).map((event) => (
                <div key={event.id} className="rounded-2xl border border-fog-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink-900">{event.summary}</p>
                      <p className="mt-1 text-sm text-ink-600">{event.actorRole === 'technician' ? t('client.portal.secure.traceability.actor.technician') : event.actorRole === 'company' ? t('client.portal.secure.traceability.actor.operations') : t('client.portal.secure.traceability.actor.system')}</p>
                    </div>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(event.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('client.portal.secure.traceability.empty.title')} description={t('client.portal.secure.traceability.empty.description')} />
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.traceability.evidence')}</p>
              <p className="mt-1 font-semibold text-ink-900">{t('client.portal.secure.traceability.photos.count', { count: serviceOrder.completionPhotos.length })}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4 text-sm text-ink-600">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('client.portal.secure.traceability.issues')}</p>
              <p className="mt-1 font-semibold text-ink-900">{t('client.portal.secure.traceability.issuesCount', { count: serviceOrder.issues.length })}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{t('client.portal.secure.technical.report.title')}</h2>
          <p className="mt-1 text-sm text-ink-600">{t('client.portal.secure.technical.report.subtitle')}</p>
        </div>
        <pre className="whitespace-pre-wrap rounded-2xl bg-fog-50 p-4 text-sm text-ink-700">{technicalReport}</pre>
      </Card>
    </div>
  );
}
