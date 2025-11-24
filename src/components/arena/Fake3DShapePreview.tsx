import clsx from 'clsx';
import React from 'react';

export interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
  className?: string;
}

const neonShadows: Record<Fake3DShapePreviewProps['shape'], string> = {
  circle: 'shadow-[0_0_20px_rgba(34,211,238,0.45)]',
  square: 'shadow-[0_0_18px_rgba(147,51,234,0.45)]',
  triangle: 'shadow-[0_0_18px_rgba(249,115,22,0.45)]',
};

export function Fake3DShapePreview({ shape, label, className }: Fake3DShapePreviewProps) {
  const baseClasses = 'inline-flex items-center gap-2 text-white/90';

  const badgeClasses = clsx(
    'relative flex items-center justify-center rounded-lg border border-white/10 bg-white/5 backdrop-blur-lg overflow-hidden',
    neonShadows[shape],
    className ?? 'w-5 h-5',
  );

  const circle = (
    <div className="relative w-full h-full">
      <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-cyan-300 via-cyan-400 to-cyan-600" />
      <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-white/70 via-cyan-100/50 to-cyan-400/40 blur-[0.5px]" />
      <div className="absolute inset-[1px] rounded-full border border-white/20" />
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: '0 0 25px rgba(34, 211, 238, 0.4)' }} />
    </div>
  );

  const cube = (
    <div className="relative w-full h-full -rotate-3">
      <div className="absolute left-[18%] right-[22%] -top-[10%] h-[28%] rounded-sm bg-gradient-to-br from-purple-300/70 to-purple-500/80 skew-x-[-12deg]" />
      <div className="absolute right-[12%] top-[20%] bottom-[18%] w-[22%] rounded-sm bg-gradient-to-b from-purple-900/70 to-purple-600/80 skew-y-[-12deg]" />
      <div className="absolute inset-[4px] rounded-md bg-gradient-to-br from-purple-500 to-purple-700" />
      <div className="absolute inset-[4px] rounded-md border border-white/15" />
      <div className="absolute inset-0 rounded-lg" style={{ boxShadow: '0 0 22px rgba(147, 51, 234, 0.45)' }} />
    </div>
  );

  const pyramid = (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-[3px]"
        style={{
          clipPath: 'polygon(50% 6%, 96% 90%, 4% 90%)',
          background: 'linear-gradient(135deg, #facc15 0%, #fb923c 60%, #f97316 100%)',
          boxShadow: '0 0 18px rgba(249, 115, 22, 0.45)',
        }}
      />
      <div
        className="absolute inset-[3px]"
        style={{
          clipPath: 'polygon(50% 6%, 52% 52%, 4% 90%)',
          background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.9), rgba(251, 146, 60, 0.65))',
        }}
      />
      <div
        className="absolute inset-[3px]"
        style={{
          clipPath: 'polygon(50% 6%, 96% 90%, 52% 52%)',
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.95), rgba(234, 88, 12, 0.7))',
        }}
      />
      <div className="absolute inset-[2px]" style={{ clipPath: 'polygon(50% 6%, 96% 90%, 4% 90%)' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
      </div>
    </div>
  );

  const shapeMap: Record<Fake3DShapePreviewProps['shape'], React.ReactNode> = {
    circle,
    square: cube,
    triangle: pyramid,
  };

  return (
    <div className={baseClasses}>
      <div className={badgeClasses}>{shapeMap[shape]}</div>
      {label && <span className="text-xs font-medium tracking-tight text-white/80">{label}</span>}
    </div>
  );
}

