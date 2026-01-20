import { type ReactNode } from 'react';
import Card from './Card';
import { useFeatureFlags, type FeatureFlags } from '@/lib/featureFlags';
import { useI18n } from '@/lib/i18n';

type FeatureGuardProps = {
  feature: keyof FeatureFlags;
  children: ReactNode;
};

export default function FeatureGuard({ feature, children }: FeatureGuardProps) {
  const { flags } = useFeatureFlags();
  const { t } = useI18n();

  if (!flags[feature]) {
    return (
      <Card>
        <p className="text-sm font-semibold text-ink-900">{t('common.featureDisabledTitle')}</p>
        <p className="mt-1 text-sm text-ink-600">{t('common.featureDisabledSubtitle')}</p>
      </Card>
    );
  }

  return <>{children}</>;
}
