import clsx from 'clsx';

interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
  color?: string;
  className?: string;
}

const defaultColors: Record<Fake3DShapePreviewProps['shape'], string> = {
  circle: '#22d3ee',
  square: '#9333EA',
  triangle: '#F59E0B',
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3 ? normalized.split('').map(char => char + char).join('') : normalized;
  const bigint = parseInt(value, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const toRgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const adjustColor = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex);
  const clamp = (value: number) => Math.min(255, Math.max(0, value));
  const factor = 1 + amount;
  return `rgb(${clamp(r * factor)}, ${clamp(g * factor)}, ${clamp(b * factor)})`;
};

export function Fake3DShapePreview({ shape, label, color, className }: Fake3DShapePreviewProps) {
  const baseColor = color || defaultColors[shape];
  const lighter = adjustColor(baseColor, 0.15);
  const darker = adjustColor(baseColor, -0.2);
  const glow = toRgba(baseColor, 0.35);

  return (
    <div className={clsx('flex flex-col items-center gap-1 text-center select-none', className)}>
      <div
        className="relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg flex items-center justify-center"
        style={{ boxShadow: `0 0 25px ${glow}` }}
      >
        {shape === 'circle' && (
          <div className="relative w-10 h-10 md:w-12 md:h-12">
            <div
              className="absolute inset-0 rounded-full blur-md"
              style={{ background: `radial-gradient(circle at 35% 35%, ${lighter}, ${baseColor})`, opacity: 0.7 }}
            />
            <div
              className="absolute inset-1 rounded-full"
              style={{ background: `radial-gradient(circle at 40% 40%, ${lighter}, ${baseColor})`, opacity: 0.9 }}
            />
            <div
              className="absolute inset-2 rounded-full"
              style={{ background: `radial-gradient(circle at 30% 30%, ${lighter}, ${darker})` }}
            />
            <div
              className="absolute inset-3 rounded-full bg-white/30"
              style={{ mixBlendMode: 'screen', opacity: 0.35 }}
            />
            <div className="absolute inset-0 rounded-full border border-white/20" />
          </div>
        )}

        {shape === 'square' && (
          <div className="relative w-10 h-10 md:w-12 md:h-12 rotate-3">
            <div className="absolute inset-0 rounded-md overflow-hidden shadow-lg" style={{ background: `linear-gradient(135deg, ${lighter}, ${darker})` }} />
            <div
              className="absolute -top-1 left-1 right-1 h-1/2 rounded-sm origin-bottom-left -skew-y-6"
              style={{ background: `linear-gradient(135deg, ${lighter}, ${baseColor})`, opacity: 0.9 }}
            />
            <div
              className="absolute top-2 -right-1 w-1/3 h-3/4 rounded-sm origin-left skew-y-6"
              style={{ background: `linear-gradient(135deg, ${baseColor}, ${darker})`, opacity: 0.8 }}
            />
            <div className="absolute inset-0 rounded-md border border-white/15" />
          </div>
        )}

        {shape === 'triangle' && (
          <div className="relative w-11 h-10 md:w-12 md:h-12 -translate-y-0.5">
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 w-0 h-0" style={{ borderLeft: '20px solid transparent', borderRight: '20px solid transparent', borderBottom: `34px solid ${baseColor}` }} />
            <div
              className="absolute left-1/2 bottom-0 -translate-x-[60%] w-0 h-0"
              style={{ borderLeft: '18px solid transparent', borderRight: '10px solid transparent', borderBottom: `30px solid ${lighter}`, filter: 'brightness(1.05)', opacity: 0.9 }}
            />
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: '10px solid transparent', borderRight: '18px solid transparent', borderBottom: `30px solid ${darker}`, opacity: 0.8 }}
            />
            <div className="absolute left-1/2 -translate-x-1/2 bottom-2 w-3 h-3 rounded-full bg-white/40 blur-[2px]" />
          </div>
        )}
      </div>

      {label && <span className="text-[11px] text-gray-300 leading-tight">{label}</span>}
    </div>
  );
}
