import type { ReactNode } from 'react';

export default function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
        {description ? <p className="text-sm text-ink-600">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
