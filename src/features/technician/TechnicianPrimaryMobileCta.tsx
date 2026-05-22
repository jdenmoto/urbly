import { Link } from 'react-router-dom';
import clsx from 'clsx';
import type { AppUserRole } from '@/core/models/appUser';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import { useI18n } from '@/lib/i18n';

type TechnicianPrimaryMobileCtaProps = {
  serviceOrder: Pick<ServiceOrder, 'id' | 'title' | 'buildingId' | 'issues' | 'timeline'> | null;
  buildingName?: string;
  technicianName?: string;
  dailyProgressCount?: number;
  issueCount?: number;
  fromPath: string;
  className?: string;
};

export function isTechnicianRole(role: AppUserRole | null | undefined) {
  return role === 'technician' || role === 'emergency_scheduler';
}

export function getTechnicianPrimaryCtaTarget(serviceOrderId?: string | null) {
  return serviceOrderId ? `/services/${serviceOrderId}` : '/services';
}

export default function TechnicianPrimaryMobileCta({
  serviceOrder,
  buildingName,
  technicianName,
  dailyProgressCount,
  issueCount,
  fromPath,
  className,
}: TechnicianPrimaryMobileCtaProps) {
  const { t } = useI18n();
  const hasService = Boolean(serviceOrder);
  const target = getTechnicianPrimaryCtaTarget(serviceOrder?.id);

  return (
    <div className={clsx('md:hidden', className)}>
      <Link
        className="block rounded-[24px] border border-emerald-200 bg-emerald-600 px-4 py-3 text-white shadow-[0_16px_44px_rgba(16,185,129,0.32)] transition hover:bg-emerald-700"
        to={target}
        state={serviceOrder ? {
          fromServices: true,
          fromPath,
          listContext: {
            buildingName: buildingName ?? t('common.no.data'),
            technicianName: technicianName ?? t('common.unassigned'),
            dailyProgressCount: dailyProgressCount ?? serviceOrder.timeline?.length ?? 0,
            issueCount: issueCount ?? serviceOrder.issues?.length ?? 0,
          },
        } : undefined}
        aria-label={hasService ? t('technician.primary.cta.aria.service') : t('technician.primary.cta.aria.services')}
      >
        <span className="block text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
          {t('technician.primary.cta.eyebrow')}
        </span>
        <span className="mt-1 block text-base font-semibold leading-5">
          {hasService ? t('technician.primary.cta.service') : t('technician.primary.cta.services')}
        </span>
        <span className="mt-1 block truncate text-xs text-emerald-50">
          {serviceOrder?.title ?? t('technician.primary.cta.servicesHint')}
        </span>
      </Link>
    </div>
  );
}
