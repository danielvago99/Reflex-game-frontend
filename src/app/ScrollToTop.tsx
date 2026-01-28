import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollBehavior = 'instant' as ScrollBehavior;
    const maxFrames = 6;
    let frameCount = 0;
    let rafId: number | null = null;

    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: scrollBehavior,
      });
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      const mainContent =
        document.querySelector('main') || document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollTo({
          top: 0,
          left: 0,
          behavior: scrollBehavior,
        });
      }

      frameCount += 1;
      if (frameCount < maxFrames) {
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
