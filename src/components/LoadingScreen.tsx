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

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center relative overflow-hidden">
      {/* Static background effects - NO ANIMATION */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 255, 163, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 163, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}></div>
        </div>

        {/* Hexagonal Pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, rgba(124, 58, 237, 0.3) 2px, transparent 0)`,
          backgroundSize: '50px 50px'
        }}></div>

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`
        }}></div>

        {/* Static Circuit Lines */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent opacity-30"></div>
          <div className="absolute top-0 left-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#06B6D4] to-transparent opacity-20"></div>
          <div className="absolute top-0 right-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#7C3AED] to-transparent opacity-20"></div>
          <div className="absolute bottom-[25%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-30"></div>
          
        </div>

        {/* Static glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00FFA3] opacity-20 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#7C3AED] opacity-20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-[#06B6D4] opacity-15 rounded-full blur-[100px]"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Reflex Icon with animations - smaller */}
        <div className="relative" style={{ perspective: '1000px' }}>
          {/* Outer rotating ring */}
          <div className="absolute inset-0 -m-6">
            <div className="w-full h-full border-2 border-[#00FFA3]/20 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
          </div>

          {/* Middle pulsing glow */}
          <div className="absolute inset-0 -m-3">
            <div className="w-full h-full bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-full blur-xl animate-pulse"></div>
          </div>

          {/* Icon container with 3D rotation - smaller */}
          <div 
            className="relative"
            style={{
              animation: 'rotate3d 4s ease-in-out infinite',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Glow effect behind */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50 rounded-full"></div>

            {/* Main gradient container - smaller */}
            <div className="relative bg-gradient-to-br from-[#00FFA3] to-[#7C3AED] p-4 rounded-3xl shadow-2xl">
              <Zap 
                className="w-12 h-12 text-[#0B0F1A]" 
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

        {/* Reflex text - even smaller */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl text-white tracking-wider drop-shadow-[0_0_20px_rgba(0,255,163,0.5)]" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            REFLEX
          </h1>
        </div>

        {/* Cyberpunk Progress bar */}
        <div className="w-80 space-y-3">
          {/* Main progress container with glitch effect */}
          <div className="relative">
            {/* Outer frame */}
            <div className="relative border border-[#00FFA3]/30 rounded-lg p-1 backdrop-blur-sm bg-white/5">
              {/* Progress track */}
              <div className="relative h-2 bg-gradient-to-r from-[#0B0F1A] via-[#0B0F1A]/80 to-[#0B0F1A] rounded overflow-hidden">
                {/* Animated background scan lines */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,255,163,0.3) 2px, rgba(0,255,163,0.3) 4px)',
                  animation: 'scan-horizontal 1s linear infinite'
                }}></div>
                
                {/* Main progress fill with animated gradient */}
                <div 
                  className="absolute inset-y-0 left-0 rounded overflow-hidden"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #00FFA3 0%, #06B6D4 50%, #7C3AED 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'gradient-shift 2s ease infinite',
                    boxShadow: '0 0 20px rgba(0,255,163,0.6), inset 0 0 10px rgba(255,255,255,0.2)'
                  }}
                >
                  {/* Glowing edge effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/80 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                  
                  {/* Moving energy particles */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-60" style={{
                      backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 10px, rgba(255,255,255,0.3) 10px, rgba(255,255,255,0.3) 20px)',
                      animation: 'particles-flow 0.8s linear infinite'
                    }}></div>
                  </div>
                </div>

                {/* Pulsing glow overlay */}
                <div 
                  className="absolute inset-y-0 left-0 pointer-events-none rounded"
                  style={{ 
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, rgba(0,255,163,0.4), rgba(6,182,212,0.4), rgba(124,58,237,0.4))',
                    filter: 'blur(4px)',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}
                ></div>
              </div>
            </div>

            {/* Corner tech details */}
            <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-[#00FFA3]"></div>
            <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-[#06B6D4]"></div>
            <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-[#7C3AED]"></div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-[#00FFA3]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}