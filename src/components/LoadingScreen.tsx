import { useEffect, useMemo, useState } from 'react';
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

    // Animate progress bar - 3 second duration
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Wait a moment before transitioning
          setTimeout(() => onComplete(), 500);
          return 100;
        }
        return prev + 1.33; // ~75 intervals for 3 seconds (100/75 = 1.33)
      });
    }, 40); // 40ms * 75 intervals = 3000ms (3 seconds)

    return () => clearInterval(interval);
  }, [isStatic, onComplete]);

  const { radius, circumference, strokeOffset } = useMemo(() => {
    const circleRadius = 110;
    const circleCircumference = 2 * Math.PI * circleRadius;
    const circleStrokeOffset = circleCircumference - (progress / 100) * circleCircumference;

    return {
      radius: circleRadius,
      circumference: circleCircumference,
      strokeOffset: circleStrokeOffset
    };
  }, [progress]);

  return (
    <div className="h-screen-dvh bg-gradient-to-b from-[#05060d] via-[#0B0F1A] to-[#05060d] flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
          linear-gradient(rgba(0, 255, 163, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
        `,
          backgroundSize: '70px 70px'
        }}
      ></div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,255,163,0.16),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(124,58,237,0.16),transparent_40%)]"></div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center">
          <svg className="w-[280px] h-[280px]" viewBox="0 0 320 320" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFA3" />
                <stop offset="50%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="2.5"
            />
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="url(#progressGradient)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              style={{
                transition: 'stroke-dashoffset 0.3s ease',
                filter: 'drop-shadow(0 0 12px rgba(0, 255, 163, 0.8))'
              }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: '1000px' }}>
            <div className="absolute inset-6 rounded-full border border-white/10 blur-sm"></div>
            <div className="absolute inset-10 rounded-full border border-[#00FFA3]/30"></div>

            <div
              className="relative bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] p-5 rounded-2xl shadow-2xl"
              style={{
                animation: 'rotate3d 5s ease-in-out infinite',
                transformStyle: 'preserve-3d'
              }}
            >
              <div className="absolute inset-0 bg-white/10 blur-xl rounded-2xl"></div>
              <Zap
                className="relative w-14 h-14 text-[#0B0F1A]"
                strokeWidth={2.4}
                style={{
                  animation: 'iconPulse 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>
        </div>

        <div className="text-center space-y-1">
          <h1
            className="text-4xl font-semibold text-white tracking-[0.3em] drop-shadow-[0_0_15px_rgba(0,255,163,0.4)]"
            style={{ fontFamily: 'Orbitron, sans-serif' }}
          >
            REFLEX
          </h1>
          <p className="text-xs uppercase text-[#7CDBFF] tracking-[0.35em]">Initializing neural link</p>
        </div>

        <div className="flex items-center gap-3 text-sm text-[#9FB7C5]">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-[#00FFA3] rounded-full animate-ping"></span>
            <span className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-ping" style={{ animationDelay: '0.15s' }}></span>
            <span className="w-1.5 h-1.5 bg-[#7C3AED] rounded-full animate-ping" style={{ animationDelay: '0.3s' }}></span>
          </div>
          <span className="uppercase tracking-widest text-xs">Loading</span>
          <span className="text-[#00FFA3] font-semibold">{Math.min(Math.round(progress), 100)}%</span>
        </div>
      </div>
    </div>
  );
}
