import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function ClientSummaryPage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('clientPortal.summaryTitle')}
      subtitle={t('clientPortal.summarySubtitle')}
      description={t('clientPortal.comingSoon')}
    />
  );
}
