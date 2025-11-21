import { Maximize, Minimize } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FullscreenToggleProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export function FullscreenToggle({ onFullscreenChange }: FullscreenToggleProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check if fullscreen is supported
  const isFullscreenSupported = 
    document.fullscreenEnabled ||
    (document as any).webkitFullscreenEnabled ||
    (document as any).mozFullScreenEnabled ||
    (document as any).msFullscreenEnabled;

  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = 
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement;

      const newIsFullscreen = !!fullscreenElement;
      setIsFullscreen(newIsFullscreen);
      onFullscreenChange?.(newIsFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [onFullscreenChange]);

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if ((elem as any).webkitRequestFullscreen) {
          await (elem as any).webkitRequestFullscreen();
        } else if ((elem as any).mozRequestFullScreen) {
          await (elem as any).mozRequestFullScreen();
        } else if ((elem as any).msRequestFullscreen) {
          await (elem as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  if (!isFullscreenSupported) {
    return null;
  }

  return (
    <motion.button
      onClick={toggleFullscreen}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="group relative w-9 h-9 sm:w-10 sm:h-10 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 hover:border-white/40 rounded-lg transition-all duration-300 flex items-center justify-center"
      aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
    >
      {/* Glow effect on hover */}
      <div className="absolute -inset-px bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/30 group-hover:via-purple-500/30 group-hover:to-pink-500/30 rounded-lg blur-sm transition-all duration-300"></div>
      
      {/* Icon with smooth transition */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {isFullscreen ? (
            <motion.div
              key="minimize"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Minimize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="maximize"
              initial={{ opacity: 0, rotate: -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 90 }}
              transition={{ duration: 0.3 }}
            >
              <Maximize className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tooltip */}
      <div className="absolute -bottom-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </div>
      </div>
    </motion.button>
  );
}
