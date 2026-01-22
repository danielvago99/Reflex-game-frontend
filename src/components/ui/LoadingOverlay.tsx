import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string; // Možnosť zmeniť text (napr. "Updating Profile...")
}

export function LoadingOverlay({ isVisible, message = 'Loading' }: LoadingOverlayProps) {
  const [dots, setDots] = useState('');

  // Animácia troch bodiek "..."
  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
      }, 500);
      return () => clearInterval(interval);
    }

    setDots('');
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative max-w-sm w-full">
        {/* Background glow effect - Consistent with theme */}
        <div className="absolute -inset-4 bg-gradient-to-br from-[#00FFA3]/20 via-[#06B6D4]/20 to-[#7C3AED]/20 blur-2xl opacity-50"></div>

        {/* Modal content container */}
        <div
          className="relative bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] border-2 border-white/20 shadow-2xl overflow-hidden flex flex-col items-center justify-center text-center p-8 min-h-[200px]"
          style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}
        >
          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-8 h-px bg-gradient-to-r from-[#00FFA3] to-transparent"></div>
          <div className="absolute top-0 left-0 w-px h-8 bg-gradient-to-b from-[#00FFA3] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-8 h-px bg-gradient-to-l from-[#7C3AED] to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-px h-8 bg-gradient-to-t from-[#7C3AED] to-transparent"></div>

          {/* Loading Animation */}
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Outer rotating ring */}
            <div className="absolute w-16 h-16 border-2 border-[#00FFA3]/30 border-t-[#00FFA3] rounded-full animate-spin"></div>

            {/* Inner rotating ring (reverse) */}
            <div
              className="absolute w-12 h-12 border-2 border-[#06B6D4]/30 border-b-[#06B6D4] rounded-full animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
            ></div>

            {/* Center Icon */}
            <div className="relative w-8 h-8 bg-gradient-to-br from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-[#00FFA3] animate-pulse" />
            </div>
          </div>

          {/* Text */}
          <h2 className="text-xl text-white font-bold tracking-wide">
            {message}
            {dots}
          </h2>

          <p className="text-xs text-gray-400 mt-2">
            Please wait while we process your request
          </p>

          {/* Progress Bar (Indeterminate) */}
          <div className="mt-6 w-32 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-1/3 animate-[shimmer_1s_infinite] translate-x-[-100%]"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
