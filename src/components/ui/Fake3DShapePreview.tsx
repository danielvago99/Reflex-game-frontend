import clsx from 'clsx';
import React from 'react';

export interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
  className?: string;
  color?: string;
}

const defaultColors: Record<Fake3DShapePreviewProps['shape'], string> = {
  circle: '#22d3ee',
  square: '#9333ea',
  triangle: '#f97316',
};

const toRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized.length === 3 ? normalized.replace(/(.)/g, '$1$1') : normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const mix = (value: number, target: number, amount: number) => Math.round(value + (target - value) * clamp(amount, 0, 1));

const adjustColor = (hex: string, amount: number, toWhite = true) => {
  const { r, g, b } = toRgb(hex);
  const target = toWhite ? 255 : 0;
  const newR = mix(r, target, Math.abs(amount));
  const newG = mix(g, target, Math.abs(amount));
  const newB = mix(b, target, Math.abs(amount));
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const toRgba = (hex: string, alpha: number) => {
  const { r, g, b } = toRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export function Fake3DShapePreview({ shape, label, className, color }: Fake3DShapePreviewProps) {
  const size = clsx('w-6 h-6', className);
  const baseColor = color || defaultColors[shape];
  const lighter = adjustColor(baseColor, 0.25);
  const darker = adjustColor(baseColor, 0.2, false);
  const innerHighlight = adjustColor(baseColor, 0.45);
  const glowStyle = { boxShadow: `0 0 14px ${toRgba(baseColor, 0.5)}` };

  const circle = (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: `linear-gradient(135deg, ${lighter}, ${darker})` }}
      />
      <div
        className="absolute inset-[3px] rounded-full"
        style={{ background: `linear-gradient(135deg, rgba(255,255,255,0.5), ${adjustColor(baseColor, 0.3)})` }}
      />
      <div className="absolute inset-[1px] rounded-full border border-white/25" />
    </div>
  );

  const square = (
    <div className="relative w-full h-full">
      <div
        className="absolute inset-0 rounded-sm"
        style={{ background: `linear-gradient(135deg, ${lighter}, ${darker})` }}
      />
      <div
        className="absolute top-0 left-[2px] w-full h-2 blur-[2px] rounded-sm"
        style={{ backgroundColor: adjustColor(baseColor, 0.35) }}
      />
      <div
        className="absolute top-[2px] left-[2px] w-2 h-full blur-[2px] rounded-sm"
        style={{ backgroundColor: adjustColor(baseColor, 0.25, false) }}
      />
      <div className="absolute inset-[1px] rounded-sm border border-white/20" />
    </div>
  );

  const triangle = (
    <div className="relative w-full h-full">
      <div 
        className="absolute inset-0" 
        style={{ 
          clipPath: 'polygon(50% 10%, 90% 90%, 10% 90%)',
          background: `linear-gradient(135deg, ${lighter} 0%, ${darker} 70%)`
        }} 
      />
      <div 
        className="absolute inset-[2px]" 
        style={{ 
          clipPath: 'polygon(50% 10%, 90% 90%, 10% 90%)',
          background: `linear-gradient(135deg, ${innerHighlight} 0%, ${adjustColor(baseColor, 0.35)} 80%)`
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
        size
      )} style={glowStyle}>
        {shapes[shape]}
      </div>
      {label && <span className="text-xs font-medium text-white/90">{label}</span>}
    </div>
  );
}
