import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function ReportsPage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('reports.title')}
      subtitle={t('reports.subtitle')}
      description={t('reports.comingSoon')}
    />
  );
}
