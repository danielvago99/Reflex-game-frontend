import { motion } from 'motion/react';
import { Target, MousePointerClick } from 'lucide-react';
import { Fake3DShapePreview } from '@/components/ui/Fake3DShapePreview';

interface TargetHintPanelProps {
  targetShape: 'circle' | 'square' | 'triangle';
  targetColor: string;
  colorName: string;
  isActive: boolean;
  hasReacted?: boolean;
  reactionTime?: number | null;
}

export function TargetHintPanel({ targetShape, targetColor, colorName, isActive, hasReacted, reactionTime }: TargetHintPanelProps) {
  const shapeLabel: Record<TargetHintPanelProps['targetShape'], string> = {
    circle: 'circle',
    square: 'box',
    triangle: 'pyramid',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-2 left-1/2 -translate-x-1/2 z-20"
    >
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-lg blur opacity-60"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/20 rounded-lg px-3 py-1.5">
          <div className="flex items-center gap-2">
            {/* Target Icon */}
            <div className="relative">
              <Target className="w-3 h-3 text-cyan-400" />
            </div>

            {/* Label */}
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Target:</span>

            {/* Shape Icon */}
            <div className="flex items-center gap-1.5">
              <Fake3DShapePreview shape={targetShape} className="w-5 h-5" color={targetColor} />
              <span className="text-xs" style={{ color: targetColor }}>
                {colorName} {shapeLabel[targetShape]}
              </span>
            </div>

            {/* Reaction Status */}
            {hasReacted && reactionTime !== null && (
              <div className="flex items-center gap-1 ml-2 pl-2 border-l border-cyan-400/30">
                <MousePointerClick className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-200 font-semibold tabular-nums">
                  {reactionTime}ms
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}