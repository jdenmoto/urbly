import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function AssetsPage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('assets.title')}
      subtitle={t('assets.subtitle')}
      description={t('assets.comingSoon')}
    />
  );
}
