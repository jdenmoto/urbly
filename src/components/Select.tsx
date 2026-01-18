import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export default function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink-700">
      {label ? <span className="font-medium text-ink-800">{label}</span> : null}
      <select
        className={clsx(
          'rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900',
          error && 'border-red-400 focus:border-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
}
