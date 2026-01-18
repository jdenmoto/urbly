import type { SVGProps } from 'react';

const base = 'currentColor';

export function LayoutDashboard(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={base} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

export function Building2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={base} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="8" height="18" rx="2" />
      <rect x="13" y="7" width="8" height="14" rx="2" />
      <path d="M7 7h2M7 11h2M7 15h2M17 11h2M17 15h2" />
    </svg>
  );
}

export function Landmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={base} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v10M19 10v10" />
      <path d="M8 10v10M12 10v10M16 10v10" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function Users(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={base} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 11a4 4 0 1 0-8 0" />
      <path d="M4 20a6 6 0 0 1 16 0" />
      <path d="M17 8a3 3 0 1 0-2-2" />
    </svg>
  );
}

export function CalendarDays(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={base} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h2M12 14h2M16 14h2" />
    </svg>
  );
}
