import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function AiWorkspacePage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('ai.title')}
      subtitle={t('ai.subtitle')}
      description={t('ai.comingSoon')}
    />
  );
}
