import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export default function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
  const variants = {
    primary: 'bg-ink-900 text-white hover:bg-ink-800',
    secondary: 'bg-white text-ink-900 border border-fog-200 hover:border-ink-900',
    ghost: 'text-ink-700 hover:text-ink-900 hover:bg-fog-100'
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
