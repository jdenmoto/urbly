import Button from './Button';

export default function TopBar({ onToggle }: { onToggle?: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-fog-200 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        {onToggle ? (
          <button
            onClick={onToggle}
            className="rounded-lg border border-fog-200 px-2 py-1 text-sm text-ink-700 hover:border-ink-900"
          >
            Menu
          </button>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-ink-900">Panel Urbly</p>
          <p className="text-xs text-ink-500">Gestion inteligente de edificios</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary">Invitar</Button>
        <Button>Nuevo</Button>
      </div>
    </header>
  );
}
