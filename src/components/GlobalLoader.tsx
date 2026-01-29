import { createContext, useContext, useMemo, useState } from 'react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useI18n } from '@/lib/i18n';

type LoaderState = {
  show: (message?: string) => void;
  hide: () => void;
};

const LoaderContext = createContext<LoaderState | undefined>(undefined);

export function useGlobalLoader() {
  const ctx = useContext(LoaderContext);
  if (!ctx) throw new Error('GlobalLoader not available');
  return ctx;
}

export default function GlobalLoaderProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const [manualCount, setManualCount] = useState(0);
  const [manualMessage, setManualMessage] = useState<string | null>(null);

  const value = useMemo(
    () => ({
      show: (message?: string) => {
        setManualCount((prev) => prev + 1);
        if (message) setManualMessage(message);
      },
      hide: () => {
        setManualCount((prev) => Math.max(0, prev - 1));
        setManualMessage(null);
      }
    }),
    []
  );

  const active = isFetching > 0 || isMutating > 0 || manualCount > 0;
  const message = manualMessage || t('common.loading');

  return (
    <LoaderContext.Provider value={value}>
      {children}
      {active ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-4">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink-700 shadow-soft">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-800" />
            {message}
          </div>
        </div>
      ) : null}
    </LoaderContext.Provider>
  );
}
