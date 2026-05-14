import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';
import { buildTechnicalReport } from '@/features/services/serviceReport';
import {
  formatServiceDateTime,
  getServiceOrderStatusLabel
} from '@/features/services/serviceOrderPresentation';
import { getClientScopedBuildings } from './clientServices';
import { getClientVisibleReportItems } from './clientReports';

function downloadName(
  index: number,
  t: (key: string, params?: Record<string, string | number>) => string
) {
  return index === 0
    ? t('client.portal.reports.pdf.primary')
    : t('client.portal.reports.pdf.numbered', { number: index + 1 });
}

export default function ClientReportsPage() {
  const { t } = useI18n();
  const { user, administrationId: authAdministrationId } = useAuth();
  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>(
    'managements',
    'management_companies'
  );
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [] } = useOperationalServiceOrders();

  const currentUser = useMemo(
    () => users.find((item) => item.id === user?.uid),
    [users, user?.uid]
  );
  const administrationId = currentUser?.administrationId ?? authAdministrationId ?? null;
  const administration = useMemo(
    () => managements.find((company) => company.id === administrationId) ?? null,
    [administrationId, managements]
  );
  const scopedBuildings = useMemo(
    () => getClientScopedBuildings(buildings, administrationId),
    [administrationId, buildings]
  );
  const reportItems = useMemo(
    () => getClientVisibleReportItems(serviceOrders, scopedBuildings, administrationId),
    [administrationId, scopedBuildings, serviceOrders]
  );

  const summary = useMemo(() => {
    const finalReports = reportItems.filter((item) => item.isFinal).length;
    const pdfs = reportItems.reduce((total, item) => total + item.pdfAttachments.length, 0);
    const photos = reportItems.reduce((total, item) => total + item.photoCount, 0);
    const issues = reportItems.reduce((total, item) => total + item.issueCount, 0);
    return { finalReports, pdfs, photos, issues };
  }, [reportItems]);

  if (!administrationId) {
    return (
      <EmptyState
        title={t('client.portal.reports.title')}
        description={t('portal.missing.access')}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('client.portal.reports.title')}
        subtitle={
          administration
            ? t('client.portal.reports.subtitleScoped', { administration: administration.name })
            : t('client.portal.reports.subtitle')
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/portal"
            >
              {t('client.portal.nav.summary')}
            </Link>
            <Link
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to="/portal/services"
            >
              {t('client.portal.nav.services')}
            </Link>
          </div>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t('client.portal.reports.visible.label')}
          value={reportItems.length}
          hint={t('client.portal.reports.visible.hint')}
        />
        <StatCard
          label={t('client.portal.reports.final.label')}
          value={summary.finalReports}
          hint={t('client.portal.reports.final.hint')}
        />
        <StatCard
          label={t('client.portal.reports.pdfs.label')}
          value={summary.pdfs}
          hint={t('client.portal.reports.pdfs.hint')}
        />
        <StatCard
          label={t('client.portal.services.evidence.label')}
          value={summary.photos}
          hint={t('client.portal.services.evidence.hint')}
        />
      </section>

      <Card className="space-y-5 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
              {t('client.portal.client.view.badge')}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-ink-900">
              {t('client.portal.reports.deliverables.title')}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-ink-600">
              {t('client.portal.reports.deliverables.description')}
            </p>
          </div>
          <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
            <p className="font-semibold text-ink-900">{summary.issues}</p>
            <p>{t('client.portal.reports.issues.hint')}</p>
          </div>
        </div>

        {reportItems.length ? (
          <div className="space-y-5">
            {reportItems.map((item) => {
              const { serviceOrder } = item;
              const building = scopedBuildings.find(
                (entry) => entry.id === serviceOrder.buildingId
              );
              return (
                <article
                  key={serviceOrder.id}
                  className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-fog-100 px-3 py-1 text-xs font-semibold text-ink-700">
                          {getServiceOrderStatusLabel(t, serviceOrder.status)}
                        </span>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isFinal ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                        >
                          {item.isFinal
                            ? t('client.portal.reports.final.badge')
                            : t('client.portal.reports.draft.badge')}
                        </span>
                        {item.pdfAttachments.length ? (
                          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                            {item.pdfAttachments.length} PDF
                          </span>
                        ) : null}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-ink-900">{serviceOrder.title}</h3>
                        <p className="text-sm text-ink-600">
                          {building?.name ?? t('common.no.data')}
                        </p>
                        <p className="mt-2 text-sm text-ink-500">
                          {t('client.portal.reports.updatedAt', {
                            date: formatServiceDateTime(item.lastUpdatedAt)
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-sm text-ink-600 sm:grid-cols-3 xl:w-[27rem]">
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('client.portal.services.evidence.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {t('client.portal.reports.photos.count', { count: item.photoCount })}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">
                          {t('services.issues.label')}
                        </p>
                        <p className="mt-1 font-semibold text-ink-900">{item.issueCount}</p>
                      </div>
                      <div className="rounded-2xl bg-fog-50 p-3">
                        <p className="text-xs uppercase tracking-wide text-ink-500">PDFs</p>
                        <p className="mt-1 font-semibold text-ink-900">
                          {item.pdfAttachments.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr,0.9fr]">
                    <div className="rounded-2xl bg-fog-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-ink-500">
                        {t('client.portal.reports.summary.label')}
                      </p>
                      <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap text-sm leading-6 text-ink-700">
                        {buildTechnicalReport(serviceOrder, t)}
                      </pre>
                    </div>
                    <div className="rounded-2xl border border-fog-200 p-4">
                      <p className="text-sm font-semibold text-ink-900">
                        {t('client.portal.reports.pdf.available')}
                      </p>
                      {item.pdfAttachments.length ? (
                        <ul className="mt-3 space-y-2 text-sm text-ink-700">
                          {item.pdfAttachments.map((url, index) => (
                            <li key={url}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                {downloadName(index, t)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-ink-500">
                          {t('client.portal.reports.pdf.empty')}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={t('client.portal.reports.empty.title')}
            description={t('client.portal.reports.empty.description')}
          />
        )}
      </Card>
    </div>
  );
}
