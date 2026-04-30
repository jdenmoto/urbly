import ComingSoonPage from '@/features/shared/ComingSoonPage';
import { useI18n } from '@/lib/i18n';

export default function CustomersPage() {
  const { t } = useI18n();

  return (
    <ComingSoonPage
      title={t('customers.title')}
      subtitle={t('customers.subtitle')}
      description={t('customers.coming.soon')}
    />
  );
}
