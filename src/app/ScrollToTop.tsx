import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollBehavior = 'instant' as ScrollBehavior;
    const maxFrames = 30;
    const maxDurationMs = 1200;
    let frameCount = 0;
    let rafId: number | null = null;
    const startTime = window.performance.now();

    const getScrollTargets = () => {
      const targets = [
        document.getElementById('page-root'),
        document.getElementById('main-content'),
        document.getElementById('root'),
        document.querySelector('main'),
        ...Array.from(document.querySelectorAll<HTMLElement>('.overflow-y-auto')),
        ...Array.from(document.querySelectorAll<HTMLElement>('[data-slot="scroll-area-viewport"]')),
      ];

      return Array.from(new Set(targets.filter(Boolean))) as HTMLElement[];
    };

    const forceTargetToTop = (target: HTMLElement) => {
      target.scrollTo({
        top: 0,
        left: 0,
        behavior: scrollBehavior,
      });
      target.scrollTop = 0;
      target.scrollIntoView({ block: 'start', behavior: scrollBehavior });
    };

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: scrollBehavior,
      });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      getScrollTargets().forEach(forceTargetToTop);

      frameCount += 1;
      if (frameCount < maxFrames && window.performance.now() - startTime < maxDurationMs) {
        rafId = window.requestAnimationFrame(scrollToTop);
      }
    };

    scrollToTop();

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [pathname]);

  return null;
}
