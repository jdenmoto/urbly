import ConfirmModal from '@/components/ConfirmModal';

export default function SchedulingStatusOverlays({
  pdfLoading,
  seriesConfirmOpen,
  onConfirmSeries,
  onCloseSeries,
  t
}: {
  pdfLoading: boolean;
  seriesConfirmOpen: boolean;
  onConfirmSeries: () => void;
  onCloseSeries: () => void;
  t: (key: string) => string;
}) {
  return (
    <>
      {pdfLoading ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-sm text-ink-700 shadow-soft">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-800" />
            {t('scheduling.pdfGenerating')}
          </div>
        </div>
      ) : null}
      <ConfirmModal
        open={seriesConfirmOpen}
        title={t('scheduling.seriesConfirmTitle')}
        description={t('scheduling.seriesConfirmDescription')}
        onConfirm={onConfirmSeries}
        onClose={onCloseSeries}
      />
    </>
  );
}
