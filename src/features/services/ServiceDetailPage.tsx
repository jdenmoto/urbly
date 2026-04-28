import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import { useOperationalServiceOrders } from './useOperationalServiceOrders';
import { useI18n } from '@/lib/i18n';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { buildCustomerMessage, buildFollowUp, buildServiceSummary } from './serviceOrderAi';
import { buildServiceSuggestions } from './serviceSuggestions';
import { getServiceDailyProgress } from './serviceProgress';
import {
  formatServiceDateTime,
  getIssueCategoryLabel,
  getIssueTypeLabel,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  getServiceOrderTypeLabel,
  serviceOrderPriorityTone
} from './serviceOrderPresentation';

const statusTone: Record<string, string> = {
  draft: 'bg-fog-100 text-ink-700',
  scheduled: 'bg-sky-50 text-sky-700',
  confirmed: 'bg-indigo-50 text-indigo-700',
  in_progress: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  cancelled: 'bg-rose-50 text-rose-700'
};

type ServiceDetailLocationState = {
  fromServices?: boolean;
  fromPath?: string;
  listContext?: {
    buildingName?: string;
    technicianName?: string;
    dailyProgressCount?: number;
    issueCount?: number;
  };
};

function getBackToListLabel(fromPath?: string) {
  if (fromPath?.startsWith('/technician')) return 'Volver al panel técnico';
  return 'Volver a servicios';
}

function getRecommendedNextStep(status: string) {
  if (status === 'completed') return 'Siguiente paso recomendado: revisar cierre, reporte y evidencia final.';
  if (status === 'in_progress') return 'Siguiente paso recomendado: validar contexto y continuar hacia el cierre técnico.';
  return 'Siguiente paso recomendado: confirmar contexto operativo antes de ejecutar el servicio.';
}

function getCloseoutActionLabel(status: string) {
  if (status === 'completed') return 'Revisar cierre técnico';
  if (status === 'in_progress') return 'Continuar cierre técnico';
  return 'Ejecutar cierre técnico';
}

function getCloseoutActionHint(status: string) {
  if (status === 'completed') return 'El servicio ya quedó marcado como completado. Aquí puedes revisar el cierre, la evidencia y el reporte.';
  if (status === 'in_progress') return 'Este servicio ya está en marcha. El siguiente paso operativo es completar el cierre técnico con evidencia y observaciones.';
  return 'Usa el cierre técnico para registrar horas, checklist, fotos finales y novedades del servicio.';
}

function getReportActionLabel(status: string) {
  if (status === 'completed') return 'Abrir reporte técnico';
  if (status === 'in_progress') return 'Preparar reporte técnico';
  return 'Ver formato de reporte';
}

function getReportActionHint(status: string) {
  if (status === 'completed') return 'El cierre ya está listo. Desde aquí puedes revisar la versión imprimible y la evidencia final sin salir del flujo de services.';
  if (status === 'in_progress') return 'El reporte final vive dentro del mismo flujo. Completa el cierre y luego revisa la versión imprimible con evidencia consolidada.';
  return 'El reporte imprimible será la salida final de este servicio una vez registres el cierre técnico y la evidencia.';
}

export default function ServiceDetailPage() {
  const { t } = useI18n();
  const { role } = useAuth();
  const location = useLocation();
  const { serviceOrderId = '' } = useParams();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const locationState = (location.state as ServiceDetailLocationState | null) ?? null;
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');

  const serviceOrder = useMemo(
    () => serviceOrders.find((item) => item.id === serviceOrderId) ?? null,
    [serviceOrderId, serviceOrders]
  );

  const building = buildings.find((item) => item.id === serviceOrder?.buildingId);
  const technician = employees.find((item) => item.id === serviceOrder?.assignedTechnicianId);
  const management = managements.find((item) => item.id === building?.managementCompanyId);
  const aiSummary = serviceOrder ? buildServiceSummary(serviceOrder, t) : '';
  const dailyProgress = serviceOrder ? getServiceDailyProgress(serviceOrder) : [];
  const aiCustomerMessage = serviceOrder ? buildCustomerMessage(serviceOrder, t) : '';
  const aiFollowUp = serviceOrder ? buildFollowUp(serviceOrder) : '';
  const aiSuggestions = serviceOrder ? buildServiceSuggestions(serviceOrder, t) : [];
  const backToServicesTarget = locationState?.fromPath ?? `/services${location.search}`;
  const listContext = locationState?.listContext;
  const currentPath = `${location.pathname}${location.search}`;
  const closeoutState = {
    fromDetail: true,
    fromPath: currentPath,
    serviceStatus: serviceOrder?.status,
    closeoutActionLabel: serviceOrder ? getCloseoutActionLabel(serviceOrder.status) : 'Ir a cierre técnico'
  };
  const reportState = {
    fromDetail: true,
    fromPath: currentPath,
    serviceStatus: serviceOrder?.status
  };
  const isTechnicianView = role === 'emergency_scheduler';

  if (!serviceOrder) {
    return <EmptyState title={t('services.detailTitle')} description={t('services.detailEmpty')} />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={serviceOrder.title}
        subtitle={t('services.detailSubtitle')}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              to={backToServicesTarget}
            >
              {getBackToListLabel(locationState?.fromPath)}
            </Link>
            <Link
              className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              to={`/services/${serviceOrder.id}/closeout`}
              state={closeoutState}
            >
              {getCloseoutActionLabel(serviceOrder.status)}
            </Link>
            {!isTechnicianView ? (
              <Link
                className="inline-flex items-center rounded-full border border-fog-200 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-fog-50"
                to={`/services/${serviceOrder.id}/print`}
                state={reportState}
              >
                {getReportActionLabel(serviceOrder.status)}
              </Link>
            ) : null}
          </div>
        }
      />

      {locationState?.fromServices ? (
        <Card className="space-y-4 border border-sky-200 bg-sky-50 p-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Contexto de llegada</p>
              <h2 className="mt-2 text-lg font-semibold text-sky-950">Llegaste desde el listado operativo de servicios</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">{getRecommendedNextStep(serviceOrder.status)}</p>
            </div>
            <Link
              className="inline-flex items-center rounded-full border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100"
              to={backToServicesTarget}
            >
              Volver al mismo filtro
            </Link>
          </div>

          <div className="grid gap-3 text-sm text-sky-950 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">Edificio</p>
              <p className="mt-1 font-semibold">{listContext?.buildingName ?? building?.name ?? t('common.noData')}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">Técnico</p>
              <p className="mt-1 font-semibold">{listContext?.technicianName ?? technician?.fullName ?? t('common.unassigned')}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">Avances diarios</p>
              <p className="mt-1 font-semibold">{listContext?.dailyProgressCount ?? dailyProgress.length}</p>
            </div>
            <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-sky-700">Novedades reportadas</p>
              <p className="mt-1 font-semibold">{listContext?.issueCount ?? serviceOrder.issues.length}</p>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="space-y-4 border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Acción principal</p>
              <h2 className="mt-2 text-lg font-semibold text-emerald-950">{getCloseoutActionLabel(serviceOrder.status)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-emerald-900">{getCloseoutActionHint(serviceOrder.status)}</p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              to={`/services/${serviceOrder.id}/closeout`}
              state={closeoutState}
            >
              {getCloseoutActionLabel(serviceOrder.status)}
            </Link>
          </div>
        </Card>

        {!isTechnicianView ? (
          <Card className="space-y-4 border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Reporte y salida final</p>
              <h2 className="mt-2 text-lg font-semibold text-ink-900">{getReportActionLabel(serviceOrder.status)}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">{getReportActionHint(serviceOrder.status)}</p>
            </div>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-fog-200 px-5 py-3 text-sm font-semibold text-ink-700 transition hover:bg-fog-50"
              to={`/services/${serviceOrder.id}/print`}
              state={reportState}
            >
              {getReportActionLabel(serviceOrder.status)}
            </Link>
          </div>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr,1fr]">
        <Card className="space-y-6 p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[serviceOrder.status] ?? statusTone.draft}`}>
                  {getServiceOrderStatusLabel(t, serviceOrder.status)}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[serviceOrder.priority]}`}>
                  {getServiceOrderPriorityPill(t, serviceOrder.priority)}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-ink-900">{t('services.contextTitle')}</h2>
                <p className="max-w-2xl text-sm leading-6 text-ink-600">{t('services.contextSubtitle')}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600">
              <p className="font-semibold text-ink-900">{getServiceOrderTypeLabel(t, serviceOrder.type)}</p>
              <p>{t('services.activeTypeHint')}</p>
            </div>
          </div>

          <div className="grid gap-3 text-sm text-ink-700 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.buildingLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{building?.name ?? t('common.noData')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.customerLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{management?.name ?? t('common.noData')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.technicianLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{technician?.fullName ?? t('common.unassigned')}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.startLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(serviceOrder.scheduledStartAt)}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.endLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{formatServiceDateTime(serviceOrder.scheduledEndAt)}</p>
            </div>
            <div className="rounded-2xl bg-fog-50 p-4">
              <p className="text-xs uppercase tracking-wide text-ink-500">{t('services.issuesLabel')}</p>
              <p className="mt-1 font-semibold text-ink-900">{serviceOrder.issues.length}</p>
            </div>
          </div>

          {serviceOrder.description ? (
            <div className="rounded-2xl border border-fog-200 p-4">
              <h3 className="text-sm font-semibold text-ink-900">{t('services.descriptionLabel')}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{serviceOrder.description}</p>
            </div>
          ) : null}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{t('services.timelineTitle')}</h2>
              <p className="text-sm text-ink-600">{t('services.timelineSubtitle')}</p>
            </div>
            {serviceOrder.timeline.length ? (
              <div className="space-y-3">
                {serviceOrder.timeline.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                    <p className="text-sm font-semibold text-ink-900">{event.summary}</p>
                    <p className="mt-1 text-xs text-ink-500">{formatServiceDateTime(event.createdAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('services.timelineTitle')} description={t('services.timelineEmpty')} />
            )}
          </Card>

          <Card className="space-y-4 p-6">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">{t('services.issueSummaryTitle')}</h2>
              <p className="text-sm text-ink-600">{t('services.issueSummarySubtitle')}</p>
            </div>
            {serviceOrder.issues.length ? (
              <div className="space-y-3">
                {serviceOrder.issues.map((issue) => (
                  <div key={issue.id} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                    <p className="text-sm font-semibold text-ink-900">{getIssueTypeLabel(t, issue.type)}</p>
                    <p className="text-xs text-ink-500">{getIssueCategoryLabel(t, issue.category)}</p>
                    {issue.description ? <p className="mt-2 text-sm leading-6 text-ink-600">{issue.description}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title={t('services.issueSummaryTitle')} description={t('services.issueSummaryEmpty')} />
            )}
          </Card>
        </div>
      </div>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Avances diarios</h2>
          <p className="text-sm text-ink-600">Seguimiento operativo para servicios largos en ejecución.</p>
        </div>
        {dailyProgress.length ? (
          <div className="space-y-3">
            {dailyProgress.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="rounded-2xl border border-fog-200 bg-fog-50 p-4">
                <div className="flex flex-wrap gap-2 text-xs text-ink-500">
                  <span>{entry.date}</span>
                  {entry.percentComplete != null ? <span>{entry.percentComplete}% completado</span> : null}
                  {entry.hoursWorked != null ? <span>{entry.hoursWorked}h trabajadas</span> : null}
                </div>
                <p className="mt-2 text-sm text-ink-700">{entry.summary}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="Sin avances diarios" description="Este servicio aún no registra seguimiento diario." />
        )}
      </Card>

      {!isTechnicianView ? (
        <>
          <Card className="space-y-6 p-6">
            <div>
              <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">IA trace</div>
              <h2 className="mt-3 text-xl font-semibold text-ink-900">Suggestions y trazabilidad</h2>
              <p className="text-sm leading-6 text-ink-600">Salida sugerida por IA con contexto y metadata de generación.</p>
            </div>

            <div className="grid gap-4 text-sm text-ink-700 xl:grid-cols-3">
              {aiSuggestions.map((item) => (
                <div key={item.id} className="rounded-3xl border border-fog-200 bg-white p-5">
                  <p className="font-semibold text-ink-900">{item.type}</p>
                  <p className="mt-3 whitespace-pre-wrap leading-6">{item.content}</p>
                  <div className="mt-4 rounded-2xl bg-fog-50 p-3 text-xs text-ink-500">
                    <p>Módulo: {item.trace.module}</p>
                    <p>Rol: {item.trace.roleScope ?? 'n/a'}</p>
                    <p>Generado: {item.trace.generatedAt}</p>
                    <p>Input: {item.trace.inputSummary}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-6 p-6">
            <div>
              <div className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                {t('services.aiBadge')}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-ink-900">{t('services.aiActionsTitle')}</h2>
              <p className="text-sm leading-6 text-ink-600">{t('services.aiActionsSubtitle')}</p>
            </div>

            <div className="grid gap-4 text-sm text-ink-700 xl:grid-cols-3">
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <p className="font-semibold text-ink-900">{t('services.aiSummaryTitle')}</p>
                <p className="mt-3 whitespace-pre-wrap leading-6">{aiSummary}</p>
              </div>
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <p className="font-semibold text-ink-900">{t('services.aiCustomerMessageTitle')}</p>
                <p className="mt-3 whitespace-pre-wrap leading-6">{aiCustomerMessage}</p>
              </div>
              <div className="rounded-3xl border border-fog-200 bg-white p-5">
                <p className="font-semibold text-ink-900">{t('services.aiFollowUpTitle')}</p>
                <p className="mt-3 whitespace-pre-wrap leading-6">{aiFollowUp}</p>
              </div>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  );
}
