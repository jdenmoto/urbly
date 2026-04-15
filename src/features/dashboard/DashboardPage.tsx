import { useMemo } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/PageHeader';
import { GlassPanel, MetricCard, MotionGrid, MotionItem, SectionHeader, StatusPill } from '@/components/premium';
import type { Building } from '@/core/models/building';
import type { Employee } from '@/core/models/employee';
import { useList, useServiceOrders } from '@/lib/api/queries';
import { useI18n } from '@/lib/i18n';

export default function DashboardPage() {
  const { t } = useI18n();
  const { data: serviceOrders = [] } = useServiceOrders();
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: employees = [] } = useList<Employee>('employees', 'employees');

  const data = useMemo(() => {
    const now = new Date();
    const active = serviceOrders.filter((item) => item.status === 'scheduled' || item.status === 'confirmed' || item.status === 'in_progress');
    const urgent = active.filter((item) => item.priority === 'urgent');
    const blocked = active.filter((item) => !item.assignedTechnicianId);
    const overdue = active.filter((item) => new Date(item.scheduledStartAt) < now);
    const upcoming = [...active]
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime())
      .slice(0, 5);

    const technicianLoad = employees
      .filter((employee) => employee.active)
      .map((employee) => ({
        id: employee.id,
        name: employee.fullName,
        assigned: active.filter((item) => item.assignedTechnicianId === employee.id).length
      }))
      .sort((a, b) => b.assigned - a.assigned)
      .slice(0, 5);

    return { active, urgent, blocked, overdue, upcoming, technicianLoad, contractsPending: 8, quotesPending: 5 };
  }, [employees, serviceOrders]);

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
      <PageHeader title={t('missionControl.title')} subtitle={t('missionControl.subtitle')} />

      <GlassPanel className="overflow-hidden bg-slate-50/60">
        <SectionHeader
          eyebrow={t('missionControl.eyebrow')}
          title={t('missionControl.heroTitle')}
          subtitle={t('missionControl.heroSubtitle')}
          aside={<StatusPill tone="info">{t('missionControl.liveLabel')}</StatusPill>}
        />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5">
            {t('missionControl.quickSchedule')}
          </button>
          <button className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5">
            {t('missionControl.quickAssign')}
          </button>
          <button className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5">
            {t('missionControl.quickQuote')}
          </button>
          <button className="rounded-2xl border border-white/70 bg-white/75 px-4 py-4 text-left text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5">
            {t('missionControl.quickContract')}
          </button>
        </div>
      </GlassPanel>

      <MotionGrid className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MotionItem><MetricCard label={t('missionControl.activeServices')} value={data.active.length} hint={t('missionControl.activeServicesHint')} /></MotionItem>
        <MotionItem><MetricCard label={t('missionControl.urgentAlerts')} value={data.urgent.length} hint={t('missionControl.urgentAlertsHint')} /></MotionItem>
        <MotionItem><MetricCard label={t('missionControl.unassigned')} value={data.blocked.length} hint={t('missionControl.unassignedHint')} /></MotionItem>
        <MotionItem><MetricCard label={t('missionControl.overdue')} value={data.overdue.length} hint={t('missionControl.overdueHint')} /></MotionItem>
      </MotionGrid>

      <div className="grid gap-4 xl:grid-cols-[1.4fr,1fr]">
        <GlassPanel>
          <SectionHeader title={t('missionControl.operationsTitle')} subtitle={t('missionControl.operationsSubtitle')} />
          <MotionGrid className="mt-6 space-y-3">
            {data.upcoming.map((order) => {
              const building = buildings.find((item) => item.id === order.buildingId);
              const technician = employees.find((item) => item.id === order.assignedTechnicianId);
              return (
                <MotionItem key={order.id}>
                  <div className="rounded-[24px] border border-white/70 bg-white/75 p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone={priorityTone(order.priority)}>{t('missionControl.priorityPill', { value: order.priority })}</StatusPill>
                          <StatusPill>{order.status}</StatusPill>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-slate-950">{order.title}</h3>
                        <p className="text-sm text-slate-600">{building?.name ?? t('common.noData')}</p>
                      </div>
                      <p className="text-sm text-slate-500">{new Date(order.scheduledStartAt).toLocaleString('es-CO')}</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('missionControl.assigneeLabel')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{technician?.fullName ?? t('common.unassigned')}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('missionControl.issuesLabel')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{order.issues?.length ?? 0}</p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-3">
                        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('missionControl.typeLabel')}</p>
                        <p className="mt-1 font-semibold text-slate-900">{order.type}</p>
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
            <SectionHeader title={t('missionControl.teamLoadTitle')} subtitle={t('missionControl.teamLoadSubtitle')} />
            <div className="mt-6 space-y-3">
              {data.technicianLoad.map((tech) => (
                <div key={tech.id} className="rounded-2xl border border-white/70 bg-white/75 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{tech.name}</p>
                    <StatusPill tone={tech.assigned >= 3 ? 'warning' : 'success'}>{t('missionControl.assignedCount', { count: tech.assigned })}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel>
            <SectionHeader title={t('missionControl.commercialTitle')} subtitle={t('missionControl.commercialSubtitle')} />
            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('missionControl.quotesPending')}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data.quotesPending}</p>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{t('missionControl.contractsPending')}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{data.contractsPending}</p>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </motion.div>
  );
}
