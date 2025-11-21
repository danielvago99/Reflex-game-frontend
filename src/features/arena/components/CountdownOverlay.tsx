import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CountdownOverlayProps {
  onComplete?: () => void;
}

export function CountdownOverlay({ onComplete }: CountdownOverlayProps) {
  const [count, setCount] = useState<number | string>('GET READY');

  useEffect(() => {
    const sequence = [
      { value: 'GET READY', duration: 1000 },
      { value: 3, duration: 1000 },
      { value: 2, duration: 1000 },
      { value: 1, duration: 1000 },
    ];

    let currentIndex = 0;

    const advance = () => {
      currentIndex++;
      if (currentIndex < sequence.length) {
        setCount(sequence[currentIndex].value);
        setTimeout(advance, sequence[currentIndex].duration);
      } else {
        onComplete?.();
      }
    };

    setTimeout(advance, sequence[0].duration);
  }, [onComplete]);

  const isText = typeof count === 'string';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div className="text-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={count}
            initial={{ scale: 0.5, opacity: 0, rotateY: isText ? 0 : -90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 1.5, opacity: 0, rotateY: isText ? 0 : 90 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Lite glow for mobile performance */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`${
                isText 
                  ? 'w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80' 
                  : 'w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64'
              } bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full blur-[60px] sm:blur-[80px] md:blur-[100px] opacity-40 sm:opacity-50`}></div>
            </div>

            {/* Content */}
            <div className={`relative ${
              isText 
                ? 'text-2xl sm:text-3xl md:text-5xl lg:text-6xl px-4 sm:px-8' 
                : 'text-[80px] sm:text-[120px] md:text-[200px] lg:text-[280px]'
            } font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-none`}>
              {count}
            </div>

            {/* Underline for text */}
            {isText && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="h-0.5 sm:h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-full mx-auto mt-2 sm:mt-4 max-w-xs"
              ></motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
