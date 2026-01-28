import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      const mainContent =
        document.querySelector('main') || document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollTo({
          top: 0,
          left: 0,
          behavior: 'auto',
        });
      }
    };

    scrollToTop();
    const timeoutId = window.setTimeout(scrollToTop, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}
