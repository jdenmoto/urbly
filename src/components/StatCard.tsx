import Card from './Card';

export default function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Card className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.2em] text-ink-500">{label}</span>
      <span className="text-3xl font-semibold text-ink-900">{value}</span>
      {hint ? <span className="text-xs text-ink-500">{hint}</span> : null}
    </Card>
  );
}
