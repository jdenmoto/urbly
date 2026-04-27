import { useI18n } from '@/lib/i18n';

export default function PhotoViewerModal({
  photoViewer,
  photoZoom,
  photoPan,
  photoDragging,
  onClose,
  onZoomOut,
  onZoomIn,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  onMouseDown
}: {
  photoViewer: { src: string; title?: string };
  photoZoom: number;
  photoPan: { x: number; y: number };
  photoDragging: boolean;
  onClose: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onMouseDown: (event: React.MouseEvent<HTMLImageElement>) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-5xl rounded-xl border-2 border-white bg-ink-900/90 p-3 shadow-soft" onClick={(event) => event.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between text-white">
          <p className="text-sm font-semibold">{photoViewer.title || 'Foto'}</p>
          <div className="flex items-center gap-2">
            <button type="button" className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10" onClick={onZoomOut}>
              -
            </button>
            <span className="min-w-12 text-center text-xs">{Math.round(photoZoom * 100)}%</span>
            <button type="button" className="rounded border border-white/40 px-2 py-1 text-xs hover:bg-white/10" onClick={onZoomIn}>
              +
            </button>
            <button
              type="button"
              className="rounded border border-rose-500 bg-rose-600 px-2 py-1 text-sm font-bold text-white hover:bg-rose-500"
              onClick={onClose}
              aria-label={t('scheduling.closeViewer')}
            >
              ✕
            </button>
          </div>
        </div>
        <div
          className={`max-h-[82vh] overflow-auto rounded-lg border border-white/30 bg-black/30 p-2 ${photoZoom > 1 ? (photoDragging ? 'cursor-grabbing' : 'cursor-grab') : ''}`}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <img
            src={photoViewer.src}
            alt={photoViewer.title || 'Foto'}
            draggable={false}
            onMouseDown={onMouseDown}
            className="mx-auto max-h-[78vh] w-auto select-none object-contain"
            style={{ transform: `translate(${photoPan.x}px, ${photoPan.y}px) scale(${photoZoom})`, transformOrigin: 'center center' }}
          />
        </div>
      </div>
    </div>
  );
}
