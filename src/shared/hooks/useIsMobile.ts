import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 640;

/**
 * Responsive breakpoint helper that avoids accessing window during SSR
 * and keeps listeners cleaned up across re-renders.
 */
export function useIsMobile(breakpoint: number = MOBILE_BREAKPOINT) {
  const getInitial = () => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.innerWidth < breakpoint;
  };

  const [isMobile, setIsMobile] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let animationFrame: number | null = null;

    const handleResize = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      animationFrame = requestAnimationFrame(() => {
        setIsMobile(window.innerWidth < breakpoint);
        animationFrame = null;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [breakpoint]);

  return isMobile;
}
