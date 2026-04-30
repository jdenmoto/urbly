import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, MotionGrid, MotionItem, SectionHeader, StatusPill } from '@/components/premium';
import { formatServiceDateTime, getServiceOrderPriorityPill, getServiceOrderStatusLabel, getServiceOrderTypeLabel } from '@/features/services/serviceOrderPresentation';
import type { AppUser } from '@/core/models/appUser';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { Employee } from '@/core/models/employee';
import { useList } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';
import { useOperationalServiceOrders } from '@/features/services/useOperationalServiceOrders';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: serviceOrders = [] } = useOperationalServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: users = [] } = useList<AppUser>('users', 'users');

  const data = useMemo(() => {
    const now = new Date();
    const active = serviceOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed' || item.status === 'in_progress');
    const agenda = active.filter((item) => item.status === 'scheduled' || item.status === 'confirmed');
    const completed = serviceOrders.filter((item) => item.status === 'completed');
    const urgent = active.filter((item) => item.priority === 'urgent');
    const blocked = active.filter((item) => !item.assignedTechnicianId);
    const overdue = active.filter((item) => new Date(item.scheduledStartAt) < now);
    const upcoming = [...active]
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .slice(0, 6);
    const alerts = [
      ...urgent.map((item) => ({
        id: `${item.id}-urgent`,
        label: t('mission.control.alert.urgent'),
        service: item.title,
        tone: 'danger' as const,
        actionLabel: t('mission.control.action.view.service'),
        to: `/services/${item.id}`
      })),
      ...blocked.map((item) => ({
        id: `${item.id}-blocked`,
        label: t('mission.control.alert.unassigned'),
        service: item.title,
        tone: 'warning' as const,
        actionLabel: t('mission.control.action.assign.service'),
        to: `/services/${item.id}`
      })),
      ...overdue.map((item) => ({
        id: `${item.id}-overdue`,
        label: t('mission.control.alert.overdue'),
        service: item.title,
        tone: 'warning' as const,
        actionLabel: t('mission.control.action.close.service'),
        to: `/services/${item.id}/closeout`
      }))
    ].slice(0, 6);

    const technicianLoad = employees
      .filter((employee) => employee.active)
      .map((employee) => ({
        id: employee.id,
        name: employee.fullName,
        assigned: active.filter((item) => item.assignedTechnicianId === employee.id).length
      }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 5);

    const recentActivity = serviceOrders
      .flatMap((order) =>
        order.timeline.map((event) => ({
          id: event.id,
          title: event.summary,
          createdAt: event.createdAt,
          serviceTitle: order.title
        }))
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);

    return {
      active,
      agenda,
      completed,
      urgent,
      blocked,
      overdue,
      upcoming,
      alerts,
      technicianLoad,
      recentActivity,
      contractsPending: contracts.filter((item) => !item.endAt || new Date(item.endAt) >= now).length,
      quotesPending: blocked.length + urgent.length,
      usersCount: users.length,
      buildingsCount: buildings.length
    };
  }, [buildings.length, contracts, employees, serviceOrders, t, users.length]);

  const priorityTone = (priority: string) => {
    if (priority === 'urgent') return 'danger';
    if (priority === 'high') return 'warning';
    if (priority === 'medium') return 'info';
    return 'success';
  };

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
    >
      <PageHeader title={t('mission.control.title')} subtitle={t('mission.control.subtitle')} />

      <GlassPanel className="overflow-hidden bg-slate-50/60">
        <SectionHeader
          eyebrow={t('mission.control.eyebrow')}
          title={t('mission.control.hero.title')}
          subtitle={t('mission.control.hero.subtitle')}
          aside={<StatusPill tone="info">{t('mission.control.live.label')}</StatusPill>}
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left transition hover:-translate-y-0.5" to="/services">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Servicios activos</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Abrir casos en curso y entrar rápido a detalle o cierre.</p>
              </div>
              <StatusPill tone="info">{data.active.length}</StatusPill>
            </div>
          </Link>
          <Link className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left transition hover:-translate-y-0.5" to="/services?status=scheduled">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Agenda operativa</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Revisar servicios programados y confirmados para la jornada.</p>
              </div>
              <StatusPill tone="warning">{data.agenda.length}</StatusPill>
            </div>
          </Link>
          <Link className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left transition hover:-translate-y-0.5" to="/buildings">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Edificios</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Entrar al contexto técnico y contractual del portafolio.</p>
              </div>
              <StatusPill>{data.buildingsCount}</StatusPill>
            </div>
          </Link>
          <Link className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left transition hover:-translate-y-0.5" to="/reports">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Reportes</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Seguir cierres completados y entregables visibles al cliente.</p>
              </div>
              <StatusPill tone="success">{data.completed.length}</StatusPill>
            </div>
          </Link>
        </div>
      </GlassPanel>

      <MotionGrid className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MotionItem><MetricCard label={t('mission.control.active.services.default')} value={data.active.length} hint={t('mission.control.active.services.hint')} /></MotionItem>
        <MotionItem><MetricCard label={t('mission.control.urgent.alerts.default')} value={data.urgent.length} hint={t('mission.control.urgent.alerts.hint')} /></MotionItem>
        <MotionItem><MetricCard label={t('mission.control.unassigned.default')} value={data.blocked.length} hint={t('mission.control.unassigned.hint')} /></MotionItem>
        <MotionItem><MetricCard label={t('mission.control.overdue.default')} value={data.overdue.length} hint={t('mission.control.overdue.hint')} /></MotionItem>
      </MotionGrid>

      <div className="grid gap-4 xl:grid-cols-[1.45fr,1fr]">
        <GlassPanel>
          <SectionHeader
            title={t('mission.control.operations.title')}
            subtitle={t('mission.control.operations.subtitle')}
            aside={<StatusPill tone="info">{`${data.upcoming.length} ${t('common.items')}`}</StatusPill>}
          />
          <MotionGrid className="mt-6 space-y-3">
            {data.upcoming.map((order) => {
              const building = buildings.find((item) => item.id === order.buildingId);
              const technician = employees.find((item) => item.id === order.assignedTechnicianId);
              return (
                <MotionItem key={order.id}>
                  <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={priorityTone(order.priority)}>{getServiceOrderPriorityPill(t, order.priority, 'mission.control.priority.pill')}</StatusPill>
                          <StatusPill>{getServiceOrderStatusLabel(t, order.status)}</StatusPill>
                          <StatusPill tone="info">{getServiceOrderTypeLabel(t, order.type)}</StatusPill>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-950">{order.title}</h3>
                        <p className="text-sm text-slate-600">{building?.name ?? t('common.no.data')}</p>
                      </div>
                      <p className="text-sm text-slate-500">{formatServiceDateTime(order.scheduledStartAt)}</p>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.assignee.label')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.issues.label')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{order.issues.length}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.type.label')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{getServiceOrderTypeLabel(t, order.type)}</p>
                      </div>
                    </div>
                  </div>
                </MotionItem>
              );
            })}
          </MotionGrid>
        </GlassPanel>

        <div className="space-y-4">
          <GlassPanel>
            <SectionHeader title={t('mission.control.alerts.title')} subtitle={t('mission.control.alerts.subtitle')} />
            <div className="mt-6 space-y-3">
              {data.alerts.map((alert) => (
                <div key={alert.id} className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{alert.service}</p>
                      <p className="text-sm text-slate-600">{alert.label}</p>
                    </div>
                    <StatusPill tone={alert.tone}>{alert.label}</StatusPill>
                  </div>
                  <div className="mt-4">
                    <Link
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      to={alert.to}
                    >
                      {alert.actionLabel}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader title={t('mission.control.team.load.title')} subtitle={t('mission.control.team.load.subtitle')} />
            <div className="mt-6 space-y-3">
              {data.technicianLoad.map((tech) => (
                <div key={tech.id} className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{tech.name}</p>
                    <StatusPill tone={tech.assigned >= 3 ? 'warning' : 'success'}>{t('mission.control.assigned.count', { count: tech.assigned })}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr,1.2fr]">
        <GlassPanel>
          <SectionHeader title={t('mission.control.commercial.title')} subtitle={t('mission.control.commercial.subtitle')} />
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-2">
            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.quotes.pending')}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.quotesPending}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.contracts.pending')}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.contractsPending}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.users.label')}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.usersCount}</p>
            </div>
            <div className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('mission.control.buildings.label')}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.buildingsCount}</p>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel>
          <SectionHeader title={t('mission.control.activity.title')} subtitle={t('mission.control.activity.subtitle')} />
          <div className="mt-6 space-y-3">
            {data.recentActivity.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-white/70 bg-white/80 p-4 shadow-sm">
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.serviceTitle}</p>
                <p className="mt-1 text-xs text-slate-500">{formatServiceDateTime(item.createdAt)}</p>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>
    </motion.div>
  );
}
