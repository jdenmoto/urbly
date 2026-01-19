import Button from './Button';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ onToggle }: { onToggle?: () => void }) {
  const { t } = useI18n();
  const { role } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between gap-4 border-b border-fog-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {onToggle ? (
          <button
            onClick={onToggle}
            className="rounded-lg border border-fog-200 px-2 py-1 text-sm text-ink-700 hover:border-ink-900"
          >
            {t('common.menu')}
          </button>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-ink-900">{t('common.panelTitle')}</p>
          <p className="text-xs text-ink-500">{t('common.panelSubtitle')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {role === 'admin' ? (
          <Button variant="secondary" onClick={() => navigate('/users?invite=1')}>
            {t('common.invite')}
          </Button>
        ) : null}
        {role !== 'view' ? <Button>{t('common.new')}</Button> : null}
      </div>
    </header>
  );
}
