import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type PerformanceMode = 'auto' | 'high' | 'low';

interface PerformanceModeContextValue {
  performanceMode: PerformanceMode;
  isLowPerformance: boolean;
  setPerformanceMode: (mode: PerformanceMode) => void;
}

const PerformanceModeContext = createContext<PerformanceModeContextValue | null>(null);

const DEFAULT_MODE: PerformanceMode = 'auto';

const runFPSTest = () => {
  if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
    return Promise.resolve(60);
  }

  return new Promise<number>((resolve) => {
    let frameCount = 0;
    const start = performance.now();

    const step = (timestamp: number) => {
      frameCount += 1;
      const elapsed = timestamp - start;

      if (elapsed >= 800) {
        resolve((frameCount * 1000) / elapsed);
        return;
      }

      requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  });
};

const detectDeviceLimits = () => {
  if (typeof window === 'undefined') {
    return { score: 0 };
  }

  let score = 0;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    score += 1;
  }

  if (typeof navigator !== 'undefined') {
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 6) {
      score += 1;
    }

    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (typeof memory === 'number' && memory > 0 && memory < 4) {
      score += 1;
    }
  }

  return { score };
};

export function PerformanceModeProvider({ children }: { children: ReactNode }) {
  const [performanceMode, setPerformanceModeState] = useState<PerformanceMode>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_MODE;
    }
    const stored = window.localStorage.getItem('performanceMode') as PerformanceMode | null;
    return stored === 'auto' || stored === 'high' || stored === 'low' ? stored : DEFAULT_MODE;
  });

  const [isLowPerformance, setIsLowPerformance] = useState(false);

  const setPerformanceMode = useCallback((mode: PerformanceMode) => {
    setPerformanceModeState(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('performanceMode', mode);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const evaluatePerformance = async () => {
      if (performanceMode === 'high') {
        if (!cancelled) {
          setIsLowPerformance(false);
        }
        return;
      }

      if (performanceMode === 'low') {
        if (!cancelled) {
          setIsLowPerformance(true);
        }
        return;
      }

      const heuristics = detectDeviceLimits();
      let fps = 60;

      try {
        fps = await runFPSTest();
      } catch (error) {
        console.warn('FPS detection failed', error); // LOW PERF MODE
      }

      const shouldThrottle = heuristics.score >= 2 || fps < 55 || (heuristics.score >= 1 && fps < 60);
      if (!cancelled) {
        setIsLowPerformance(shouldThrottle);
      }
    };

    evaluatePerformance();

    return () => {
      cancelled = true;
    };
  }, [performanceMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.toggle('low-performance', isLowPerformance);
    }
  }, [isLowPerformance]);

  const value = useMemo(
    () => ({
      performanceMode,
      isLowPerformance,
      setPerformanceMode,
    }),
    [performanceMode, isLowPerformance, setPerformanceMode]
  );

  return <PerformanceModeContext.Provider value={value}>{children}</PerformanceModeContext.Provider>;
}

export function usePerformanceMode() {
  const context = useContext(PerformanceModeContext);
  if (!context) {
    throw new Error('usePerformanceMode must be used within a PerformanceModeProvider');
  }
  return context;
}
