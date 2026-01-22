import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);

      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      const root = document.getElementById('root');
      if (root) {
        root.scrollTop = 0;
      }
    };

    scrollToTop();

    const timeout = setTimeout(scrollToTop, 50);

    return () => clearTimeout(timeout);
  }, [pathname]);
}
