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
  const strokeColor = adjustColor(baseColor, 0.5);

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

  const square = (() => {
    // Use SVG to mirror the isometric cube proportions used in the PIXI renderer
    const cubeSize = 9;
    const offset = cubeSize * 0.65;

    const frontTopLeft = { x: -cubeSize, y: -cubeSize + offset };
    const frontTopRight = { x: cubeSize, y: -cubeSize + offset };
    const frontBottomRight = { x: cubeSize, y: cubeSize + offset };
    const frontBottomLeft = { x: -cubeSize, y: cubeSize + offset };

    const depth = { x: offset, y: -offset };

    const topBackLeft = { x: frontTopLeft.x + depth.x, y: frontTopLeft.y + depth.y };
    const topBackRight = { x: frontTopRight.x + depth.x, y: frontTopRight.y + depth.y };
    const backBottomRight = { x: frontBottomRight.x + depth.x, y: frontBottomRight.y + depth.y };
    const backBottomLeft = { x: frontBottomLeft.x + depth.x, y: frontBottomLeft.y + depth.y };

    const coords = [
      frontTopLeft,
      frontTopRight,
      frontBottomRight,
      frontBottomLeft,
      topBackLeft,
      topBackRight,
      backBottomRight,
      backBottomLeft,
    ];

    const minX = Math.min(...coords.map(p => p.x));
    const maxX = Math.max(...coords.map(p => p.x));
    const minY = Math.min(...coords.map(p => p.y));
    const maxY = Math.max(...coords.map(p => p.y));
    const padding = 3;

    const viewBox = `${minX - padding} ${minY - padding} ${maxX - minX + padding * 2} ${maxY - minY + padding * 2}`;

    const topFace = `${frontTopLeft.x},${frontTopLeft.y} ${frontTopRight.x},${frontTopRight.y} ${topBackRight.x},${topBackRight.y} ${topBackLeft.x},${topBackLeft.y}`;
    const rightFace = `${frontTopRight.x},${frontTopRight.y} ${frontBottomRight.x},${frontBottomRight.y} ${backBottomRight.x},${backBottomRight.y} ${topBackRight.x},${topBackRight.y}`;
    const leftFace = `${frontTopLeft.x},${frontTopLeft.y} ${frontBottomLeft.x},${frontBottomLeft.y} ${backBottomLeft.x},${backBottomLeft.y} ${topBackLeft.x},${topBackLeft.y}`;
    const frontFace = `${frontBottomLeft.x},${frontBottomLeft.y} ${frontBottomRight.x},${frontBottomRight.y} ${frontTopRight.x},${frontTopRight.y} ${frontTopLeft.x},${frontTopLeft.y}`;
    const bottomGlow = `${frontBottomLeft.x},${frontBottomLeft.y} ${backBottomLeft.x},${backBottomLeft.y} ${backBottomRight.x},${backBottomRight.y} ${frontBottomRight.x},${frontBottomRight.y}`;

    const topColor = adjustColor(baseColor, 0.15);
    const frontColor = adjustColor(baseColor, -0.1, false);
    const sideColor = adjustColor(baseColor, -0.2, false);

    return (
      <svg viewBox={viewBox} className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points={topFace} fill={topColor} fillOpacity="0.95" />
        <polygon points={rightFace} fill={sideColor} fillOpacity="0.9" />
        <polygon points={leftFace} fill={adjustColor(baseColor, -0.25, false)} fillOpacity="0.4" />
        <polygon points={frontFace} fill={frontColor} fillOpacity="0.95" />
        <polygon points={bottomGlow} fill={adjustColor(baseColor, -0.35, false)} fillOpacity="0.25" />
        <polyline
          points={`
            ${frontTopLeft.x},${frontTopLeft.y}
            ${topBackLeft.x},${topBackLeft.y}
            ${topBackRight.x},${topBackRight.y}
            ${frontTopRight.x},${frontTopRight.y}
            ${frontTopLeft.x},${frontTopLeft.y}
            ${frontBottomLeft.x},${frontBottomLeft.y}
            ${frontTopLeft.x},${frontTopLeft.y}
            ${frontBottomRight.x},${frontBottomRight.y}
            ${frontTopRight.x},${frontTopRight.y}
            ${frontBottomRight.x},${frontBottomRight.y}
            ${backBottomRight.x},${backBottomRight.y}
            ${topBackRight.x},${topBackRight.y}
            ${frontBottomLeft.x},${frontBottomLeft.y}
            ${backBottomLeft.x},${backBottomLeft.y}
            ${topBackLeft.x},${topBackLeft.y}
            ${backBottomLeft.x},${backBottomLeft.y}
            ${backBottomRight.x},${backBottomRight.y}
          `}
          stroke={strokeColor}
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.85}
        />
      </svg>
    );
  })();

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
