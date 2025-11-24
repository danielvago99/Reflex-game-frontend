import clsx from 'clsx';
import React from 'react';

export interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
  className?: string;
}

const glow: Record<string, string> = {
  circle: 'shadow-[0_0_14px_rgba(34,211,238,0.5)]',
  square: 'shadow-[0_0_14px_rgba(147,51,234,0.5)]',
  triangle: 'shadow-[0_0_14px_rgba(249,115,22,0.5)]',
};

export function Fake3DShapePreview({ shape, label, className }: Fake3DShapePreviewProps) {
  const size = clsx('w-6 h-6', className);

  const circle = (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600" />
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/50 to-cyan-300/30" />
      <div className="absolute inset-[1px] rounded-full border border-white/25" />
    </div>
  );

  const square = (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-700 rounded-sm" />
      <div className="absolute top-0 left-[2px] w-full h-2 bg-purple-400/60 blur-[2px] rounded-sm" />
      <div className="absolute top-[2px] left-[2px] w-2 h-full bg-purple-600/60 blur-[2px] rounded-sm" />
      <div className="absolute inset-[1px] rounded-sm border border-white/20" />
    </div>
  );

  const triangle = (
    <div className="relative w-full h-full">
      <div 
        className="absolute inset-0" 
        style={{ 
          clipPath: 'polygon(50% 10%, 90% 90%, 10% 90%)',
          background: 'linear-gradient(135deg, #fb923c 0%, #ea580c 70%)'
        }} 
      />
      <div 
        className="absolute inset-[2px]" 
        style={{ 
          clipPath: 'polygon(50% 10%, 90% 90%, 10% 90%)',
          background: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 80%)'
        }} 
      />
      <div className="absolute inset-[1px] border border-white/20" style={{ clipPath: 'polygon(50% 10%, 90% 90%, 10% 90%)' }} />
    </div>
  );

  const shapes = { circle, square, triangle };

  return (
    <div className="inline-flex items-center gap-2">
      <div className={clsx(
        'relative flex items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-md overflow-hidden',
        glow[shape],
        size
      )}>
        {shapes[shape]}
      </div>
      {label && <span className="text-xs font-medium text-white/90">{label}</span>}
    </div>
  );
}
