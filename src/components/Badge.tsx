import type { HTMLAttributes } from 'react';
import clsx from 'clsx';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
};

export default function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  const tones = {
    neutral: 'bg-fog-100 text-ink-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700'
  };
  return (
    <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold', tones[tone], className)} {...props} />
  );
}
