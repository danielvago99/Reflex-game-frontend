import { useEffect, useRef, useState } from 'react';
import { Zap } from 'lucide-react';
import { FuturisticBackground } from './FuturisticBackground';

interface LoadingScreenProps {
  onComplete: () => void;
  isStatic?: boolean;
}

export function LoadingScreen({ onComplete, isStatic = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(isStatic ? 100 : 0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (isStatic) {
      setProgress(100);
      return;
    }

    // Animate progress bar - 3 second duration
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 1.33;

        if (next >= 100) {
          if (!completedRef.current) {
            completedRef.current = true;
            clearInterval(interval);
            onComplete();
          }
          return 100;
        }

        return next;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isStatic, onComplete]);

  return (
    <div id="page-root" className="h-screen-dvh bg-[#0B0F1A] flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0">
        <FuturisticBackground />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Reflex Icon with animations */}
        <div className="relative" style={{ perspective: '1000px' }}>
                   
          {/* Middle pulsing glow */}
          <div className="absolute inset-0 -m-4">
            <div className="w-full h-full bg-gradient-to-r from-[#06B6D4]/10 to-[#7C3AED]/10 rounded-full blur-xl animate-pulse"></div>
          </div>

          {/* Icon container with 3D rotation */}
          <div 
            className="relative"
            style={{
              animation: 'rotate3d 4s ease-in-out infinite',
              transformStyle: 'preserve-3d'
            }}
          >         
            {/* Main gradient container - matching Welcome page */}
            <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#7C3AED] p-6 rounded-3xl shadow-2xl">
              <Zap 
                className="w-16 h-16 text-[#0B0F1A]" 
                strokeWidth={2.5}
                style={{
                  animation: 'iconPulse 2s ease-in-out infinite'
                }}
              />
            </div>
          </div>

          {/* Corner accents */}
          <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#00FFA3] rounded-tl-lg"></div>
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#00FFA3] rounded-tr-lg"></div>
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#06B6D4] rounded-bl-lg"></div>
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#06B6D4] rounded-br-lg"></div>
        </div>

        {/* Reflex text */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl xs:text-4xl mb-2 xs:mb-3 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] bg-clip-text text-transparent" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            REFLEXMATCH.io
          </h1>
        </div>

        {/* Progress bar */}
        <div className="w-64 space-y-2">
          <div className="relative h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,255,163,0.5)]"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Loading text */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-[#00FFA3] rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-[#06B6D4] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-[#7C3AED] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="uppercase tracking-wider">Loading</span>
          </div>
        </div>
      </div>
    </div>
  );
}
