import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';

interface LoadingScreenProps {
  onComplete: () => void;
  isStatic?: boolean;
}

export function LoadingScreen({ onComplete, isStatic = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(isStatic ? 100 : 0);

  useEffect(() => {
    if (isStatic) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 1.33;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isStatic, onComplete]);

  return (
    <div className="h-screen-dvh bg-[#0B0F1A] flex items-center justify-center relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-60 rounded-3xl" />
          <div className="absolute -inset-2 rounded-[1.4rem] bg-[conic-gradient(from_0deg,#00FFA3,#06B6D4,#7C3AED,#00FFA3)] opacity-50 animate-[spin_8s_linear_infinite]" />
          <div className="relative bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-4 rounded-2xl shadow-[0_0_25px_rgba(0,255,163,0.45)]">
            <Zap className="w-10 h-10 text-[#0B0F1A]" strokeWidth={2.4} />
          </div>
        </div>

        <h1
          className="text-2xl text-white tracking-[0.35em] uppercase"
          style={{ fontFamily: 'Orbitron, system-ui, sans-serif' }}
        >
          REFLEX
        </h1>

        <div className="w-full mt-2" style={{ width: 'min(90vw, 18rem)' }}>
          <div className="relative h-2 bg-white/15 rounded-full overflow-hidden">
            <div
              className="absolute inset-0 z-0 opacity-60 bg-[linear-gradient(90deg,rgba(11,15,26,0.85)_0,rgba(11,15,26,0.85)_36%,rgba(56,189,248,0.28)_50%,rgba(11,15,26,0.85)_64%,rgba(11,15,26,0.85)_100%)] bg-[length:3rem_100%] animate-[moveGrid_1.1s_linear_infinite] pointer-events-none"
            />
            <div
              className="relative z-10 h-full rounded-full bg-[radial-gradient(circle_at_0%_50%,#00FFA3,transparent_55%),linear-gradient(to_right,#00FFA3,#06B6D4,#7C3AED)] shadow-[0_0_18px_rgba(0,255,163,0.65)] transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
