import { forwardRef, type InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, required, ...props }, ref) => {
  return (
    <label className="flex w-full flex-col gap-1 text-sm text-ink-700">
      {label ? (
        <span className="font-medium text-ink-800">
          {label}
          {required ? <span className="ml-1 text-red-500">*</span> : null}
        </span>
      ) : null}
      <input
        ref={ref}
        className={clsx(
          'rounded-lg border border-fog-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none transition focus:border-ink-900',
          error && 'border-red-400 focus:border-red-500',
          className
        )}
        required={required}
        {...props}
      />
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </label>
  );
});

Input.displayName = 'Input';

export default Input;
