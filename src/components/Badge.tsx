import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

export default function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  const tones = {
    neutral: 'bg-fog-200 text-ink-900',
    success: 'bg-emerald-200 text-emerald-900',
    warning: 'bg-amber-200 text-amber-900',
    danger: 'bg-rose-200 text-rose-900'
  };
  return (
    <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)} {...props} />
  );
}
