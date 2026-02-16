export const BREAKPOINTS = {
  mobileMax: 767,
  ipadMin: 768,
  desktopMin: 1024
} as const;

export type BreakpointName = 'mobile' | 'ipad' | 'desktop';

export function getBreakpoint(width: number): BreakpointName {
  if (width >= BREAKPOINTS.desktopMin) return 'desktop';
  if (width >= BREAKPOINTS.ipadMin) return 'ipad';
  return 'mobile';
}
