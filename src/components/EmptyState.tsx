import type { ReactNode } from 'react';

export default function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-fog-200 bg-white/60 p-6">
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="text-sm text-ink-600">{description}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
