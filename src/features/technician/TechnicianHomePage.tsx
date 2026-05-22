import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import { useAuth } from '@/app/Auth';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import type { ServiceOrderStatus } from '@/core/models/serviceOrder';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { useOperationalServiceOrders, type OperationalServiceOrder } from '@/features/services/useOperationalServiceOrders';
import TechnicianPrimaryMobileCta from './TechnicianPrimaryMobileCta';
import {
  formatServiceDateTime,
  getServiceOrderPriorityLabel,
  getServiceOrderPriorityPill,
  getServiceOrderStatusLabel,
  serviceOrderPriorityTone
} from '@/features/services/serviceOrderPresentation';

type TechnicianListContext = {
  fromPath: string;
};

type TechnicianOrderListContext = {
  buildingName: string;
  technicianName: string;
  dailyProgressCount: number;
  issueCount: number;
};

const CLOSED_SERVICE_STATUSES: ServiceOrderStatus[] = ['completed', 'cancelled'];
const ACTIVE_SERVICE_STATUSES: ServiceOrderStatus[] = ['in_progress', 'paused'];
const PRIORITY_RANK: Record<OperationalServiceOrder['priority'], number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function byScheduleAndPriority(a: OperationalServiceOrder, b: OperationalServiceOrder) {
  const priorityDelta = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  const scheduleDelta = new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime();

  return scheduleDelta || priorityDelta;
}

export function isOpenTechnicianOrder(order: Pick<OperationalServiceOrder, 'status'>) {
  return !CLOSED_SERVICE_STATUSES.includes(order.status);
}

export function isActiveTechnicianOrder(order: Pick<OperationalServiceOrder, 'status'>) {
  return ACTIVE_SERVICE_STATUSES.includes(order.status);
}

export function getTechnicianPrimaryOrder(orders: OperationalServiceOrder[]) {
  const activeOrder = [...orders]
    .filter((order) => isOpenTechnicianOrder(order) && isActiveTechnicianOrder(order))
    .sort(byScheduleAndPriority)[0];

  return activeOrder ?? [...orders].filter(isOpenTechnicianOrder).sort(byScheduleAndPriority)[0] ?? null;
}

function buildServiceListContext(
  order: OperationalServiceOrder,
  buildingName: string,
  technicianName: string,
): TechnicianOrderListContext {
  return {
    buildingName,
    technicianName,
    dailyProgressCount: order.timeline.length,
    issueCount: order.issues.length,
  };
}

function LoadingServiceSkeleton() {
  return (
    <div className="space-y-4 rounded-3xl border border-fog-200 bg-white p-5 shadow-sm" aria-busy="true">
      <div className="h-5 w-32 rounded-full bg-fog-100" />
      <div className="space-y-2">
        <div className="h-6 w-2/3 rounded-full bg-fog-100" />
        <div className="h-4 w-1/2 rounded-full bg-fog-100" />
        <div className="h-4 w-40 rounded-full bg-fog-100" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-20 rounded-2xl bg-fog-50" />
        <div className="h-20 rounded-2xl bg-fog-50" />
        <div className="h-20 rounded-2xl bg-fog-50" />
      </div>
    </div>
  );
}

export default function TechnicianHomePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const { data: users = [], isLoading: isLoadingUsers } = useList<AppUser>('users', 'users');
  const { data: employees = [], isLoading: isLoadingEmployees } = useList<Employee>('employees', 'employees');
  const { data: buildings = [], isLoading: isLoadingBuildings } = useList<Building>('buildings', 'buildings');
  const { data: serviceOrders = [], isLoading: isLoadingServiceOrders } = useOperationalServiceOrders();

  const currentUser = useMemo(() => users.find((item) => item.id === user?.uid), [users, user?.uid]);
  const employee = useMemo(
    () => employees.find((item) => item.email.toLowerCase() === currentUser?.email?.toLowerCase()),
    [employees, currentUser?.email]
  );

  const assignedOrders = useMemo(() => {
    if (!employee) return [];
    return serviceOrders
      .filter((item) => item.assignedTechnicianId === employee.id)
      .sort(byScheduleAndPriority);
  }, [employee, serviceOrders]);

  const openOrders = assignedOrders.filter(isOpenTechnicianOrder);
  const primaryOrder = getTechnicianPrimaryOrder(assignedOrders);
  const activeOrderCount = openOrders.filter(isActiveTechnicianOrder).length;
  const primaryOrderBuildingName = primaryOrder ? buildings.find((item) => item.id === primaryOrder.buildingId)?.name : undefined;
  const visibleOrders = openOrders.slice(0, 5);
  const technicianListState: TechnicianListContext = { fromPath: '/technician' };
  const isLoading = isLoadingUsers || isLoadingEmployees || isLoadingBuildings || isLoadingServiceOrders;

  const getBuildingName = (buildingId: string) => buildings.find((item) => item.id === buildingId)?.name ?? t('common.no.data');
  const technicianName = employee?.fullName ?? t('common.no.data');

  return (
    <div className="space-y-8 pb-28 md:pb-0">
      <PageHeader
        title={t('technician.home.title')}
        subtitle={t('technician.home.subtitle')}
        actions={
          <Link
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            to="/services"
          >
            {t('technician.primary.cta.services')}
          </Link>
        }
      />

      <TechnicianPrimaryMobileCta
        className="fixed inset-x-4 bottom-24 z-30"
        serviceOrder={primaryOrder}
        buildingName={primaryOrderBuildingName}
        technicianName={employee?.fullName}
        fromPath="/technician"
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label={t('technician.assigned.services')} value={assignedOrders.length} />
        <StatCard label={t('technician.pending.services')} value={openOrders.length} />
        <StatCard label={t('technician.issues.detected')} value={assignedOrders.reduce((acc, item) => acc + item.issues.length, 0)} />
      </section>

      <Card className="space-y-6 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {activeOrderCount > 0 ? t('technician.active.badge') : t('technician.mobile.badge')}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink-900">
                {activeOrderCount > 0 ? t('technician.active.service.title') : t('technician.next.service.title')}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-ink-600">
                {activeOrderCount > 0 ? t('technician.active.service.subtitle') : t('technician.next.service.subtitle')}
              </p>
            </div>
          </div>
          <div className="grid gap-2 rounded-2xl border border-fog-200 bg-fog-50 px-4 py-3 text-sm text-ink-600 sm:grid-cols-2">
            <div>
              <p className="font-semibold text-ink-900">{openOrders.length}</p>
              <p>{t('technician.open.services.summary')}</p>
            </div>
            <div>
              <p className="font-semibold text-ink-900">{activeOrderCount}</p>
              <p>{t('technician.active.services.summary')}</p>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingServiceSkeleton />
        ) : !employee ? (
          <EmptyState title={t('technician.next.service.title')} description={t('technician.missing.employee')} />
        ) : !primaryOrder ? (
          <EmptyState title={t('technician.next.service.title')} description={t('technician.empty')} />
        ) : (
          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm ring-1 ring-emerald-50">
            <div className="flex flex-wrap gap-2">
              {isActiveTechnicianOrder(primaryOrder) ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {t('technician.active.badge')}
                </span>
              ) : null}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[primaryOrder.priority]}`}>
                {getServiceOrderPriorityPill(t, primaryOrder.priority, 'technician.priority.pill')}
              </span>
            </div>
            <div className="mt-3 space-y-1">
              <p className="text-lg font-semibold text-ink-900">{primaryOrder.title}</p>
              <p className="text-sm text-ink-600">{getBuildingName(primaryOrder.buildingId)}</p>
              <p className="text-sm text-ink-500">{formatServiceDateTime(primaryOrder.scheduledStartAt)}</p>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-ink-600 md:grid-cols-3">
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.status.label')}</p>
                <p className="mt-1 font-semibold text-ink-900">{getServiceOrderStatusLabel(t, primaryOrder.status)}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.priority.label')}</p>
                <p className="mt-1 font-semibold text-ink-900">{getServiceOrderPriorityLabel(t, primaryOrder.priority)}</p>
              </div>
              <div className="rounded-2xl bg-fog-50 p-4">
                <p className="text-xs uppercase tracking-wide text-ink-500">{t('technician.issues.label')}</p>
                <p className="mt-1 font-semibold text-ink-900">{primaryOrder.issues.length}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className="inline-flex items-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                to={`/services/${primaryOrder.id}`}
                state={{
                  fromServices: true,
                  ...technicianListState,
                  listContext: buildServiceListContext(primaryOrder, getBuildingName(primaryOrder.buildingId), technicianName)
                }}
              >
                {t('technician.actions.openService')}
              </Link>
              <Link
                className="inline-flex items-center rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                to={`/services/${primaryOrder.id}/closeout`}
                state={technicianListState}
              >
                {t('technician.actions.closeOrReport')}
              </Link>
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">{t('technician.queue.title')}</h2>
          <p className="text-sm leading-6 text-ink-600">{t('technician.queue.subtitle')}</p>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            <LoadingServiceSkeleton />
            <LoadingServiceSkeleton />
          </div>
        ) : !employee ? (
          <EmptyState title={t('technician.queue.title')} description={t('technician.missing.employee')} />
        ) : visibleOrders.length === 0 ? (
          <EmptyState title={t('technician.queue.title')} description={t('technician.empty')} />
        ) : (
          <div className="space-y-3">
            {visibleOrders.map((order) => (
              <div key={order.id} className="rounded-3xl border border-fog-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {order.id === primaryOrder?.id ? (
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                          {isActiveTechnicianOrder(order) ? t('technician.queue.current') : t('technician.queue.next')}
                        </span>
                      ) : null}
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${serviceOrderPriorityTone[order.priority]}`}>
                        {getServiceOrderPriorityPill(t, order.priority, 'technician.priority.pill')}
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-ink-900">{order.title}</p>
                    <p className="text-sm text-ink-600">{getBuildingName(order.buildingId)}</p>
                    <p className="text-sm text-ink-500">{formatServiceDateTime(order.scheduledStartAt)}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      to={`/services/${order.id}`}
                      state={{
                        fromServices: true,
                        ...technicianListState,
                        listContext: buildServiceListContext(order, getBuildingName(order.buildingId), technicianName)
                      }}
                    >
                      {t('technician.actions.detail')}
                    </Link>
                    <Link
                      className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      to={`/services/${order.id}/closeout`}
                      state={technicianListState}
                    >
                      {t('technician.actions.progressCloseout')}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
