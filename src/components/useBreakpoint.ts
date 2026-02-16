import { useEffect, useState } from 'react';
import { BREAKPOINTS, getBreakpoint } from '@/config/breakpoints';

export default function useBreakpoint() {
  const [width, setWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const current = getBreakpoint(width);

  return {
    width,
    current,
    isMobile: current === 'mobile',
    isIpad: current === 'ipad',
    isTablet: current === 'ipad',
    isDesktop: current === 'desktop',
    breakpoints: BREAKPOINTS
  };
}
