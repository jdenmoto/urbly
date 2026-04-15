import clsx from 'clsx';
import { motion } from 'framer-motion';
import type { PropsWithChildren, ReactNode } from 'react';

export function GlassPanel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'rounded-[28px] border border-white/55 bg-white/70 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ eyebrow, title, subtitle, aside }: { eyebrow?: string; title: string; subtitle?: string; aside?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
      <div className="space-y-2">
        {eyebrow ? <div className="inline-flex rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">{eyebrow}</div> : null}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
      {aside}
    </div>
  );
}

export function MetricCard({ label, value, hint }: { label: string; value: ReactNode; hint: string }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 260, damping: 22 }}>
      <GlassPanel className="h-full p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{hint}</p>
      </GlassPanel>
    </motion.div>
  );
}

export function StatusPill({ children, tone = 'default' }: PropsWithChildren<{ tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }>) {
  const tones = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-rose-50 text-rose-700',
    info: 'bg-sky-50 text-sky-700'
  };

  return <span className={clsx('inline-flex rounded-full px-3 py-1 text-xs font-semibold', tones[tone])}>{children}</span>;
}

export function MotionGrid({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {children}
    </motion.div>
  );
}

export function MotionItem({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      transition={{ type: 'spring', stiffness: 180, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
