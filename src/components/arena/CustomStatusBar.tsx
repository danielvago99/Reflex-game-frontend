import { Wifi, Battery, Signal } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface CustomStatusBarProps {
  isVisible: boolean;
}

export function CustomStatusBar({ isVisible }: CustomStatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-[60] h-6 sm:h-7 bg-black/95 backdrop-blur-md border-b border-white/10"
      style={{ 
        paddingTop: 'var(--safe-area-top)',
      }}
    >
      <div className="h-full px-3 sm:px-4 flex items-center justify-between">
        {/* Left - Time */}
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-medium font-mono">
            {formatTime(currentTime)}
          </span>
        </div>

        {/* Center - Game branding */}
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-semibold">
            REFLEX
          </span>
          <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>

        {/* Right - Status icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Signal className="w-3 h-3 text-white" />
          <Wifi className="w-3 h-3 text-white" />
          <div className="flex items-center gap-0.5">
            <Battery className="w-3 h-3 text-white" />
            <span className="text-[10px] text-white font-medium">95%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}