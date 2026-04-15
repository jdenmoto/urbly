import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function TechnicianHomePage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('technician.homeTitle')}
      subtitle={t('technician.homeSubtitle')}
      description={t('technician.comingSoon')}
    />
  );
}
