import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // 1. Zruš pamäť prehliadača
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const resetScroll = () => {
      // 2. Resetni hlavné okno
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      // 3. Nájdi VŠETKY potenciálne scrollovateľné divy
      // Toto pokryje tvoje ID, tvoje CSS triedy aj main tag
      const targets = document.querySelectorAll(
        '#page-root, #main-content, main, .overflow-y-auto, .h-screen-dvh, min-h-screen, [data-radix-scroll-area-viewport]'
      );

      targets.forEach((el) => {
        // Natvrdo nastavíme 0, bez animácie
        el.scrollTop = 0;
      });
    };

    // 4. Okamžitý reset
    resetScroll();

    // 5. Polling (kvôli Suspense/Loading)
    // Kontrolujeme každých 10ms po dobu 500ms
    const intervalId = setInterval(resetScroll, 10);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 500);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}
