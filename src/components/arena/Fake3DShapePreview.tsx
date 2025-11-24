import clsx from 'clsx';

interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
  accentColor?: string;
  className?: string;
}

const clamp = (value: number) => Math.max(0, Math.min(255, value));

const adjustColor = (hex: string, amount: number) => {
  const normalized = hex.replace('#', '');
  const isValidHex = /^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(normalized);

  if (!isValidHex) {
    return hex;
  }

  const num = parseInt(normalized.length === 3 ? normalized.split('').map((c) => c + c).join('') : normalized, 16);
  const r = clamp((num >> 16) + amount);
  const g = clamp(((num >> 8) & 0x00ff) + amount);
  const b = clamp((num & 0x0000ff) + amount);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
};

const defaultColors: Record<'circle' | 'square' | 'triangle', string> = {
  circle: '#22d3ee',
  square: '#9333EA',
  triangle: '#F59E0B',
};

export function Fake3DShapePreview({ shape, label, accentColor, className }: Fake3DShapePreviewProps) {
  const baseColor = accentColor || defaultColors[shape];
  const highlight = adjustColor(baseColor, 40);
  const shadow = adjustColor(baseColor, -40);

  const commonContainer = 'relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14';

  const circle = (
    <div className={commonContainer}>
      <div
        className="absolute inset-0 rounded-full blur"
        style={{ boxShadow: `0 0 25px ${baseColor}66` }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${highlight}, ${baseColor})`,
          boxShadow: `0 0 25px ${baseColor}55 inset, 0 0 25px ${baseColor}33`,
        }}
      />
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background: `radial-gradient(circle at 40% 40%, ${highlight}, ${shadow})`,
        }}
      />
      <div
        className="absolute w-4 h-4 md:w-5 md:h-5 rounded-full bg-white/40 blur-sm"
        style={{ top: '24%', left: '26%' }}
      />
      <div className="relative w-10 h-10 md:w-11 md:h-11 rounded-full border border-white/20" />
    </div>
  );

  const square = (
    <div className={clsx(commonContainer, 'rotate-3')}>
      <div className="absolute inset-0" style={{ boxShadow: `0 0 22px ${baseColor}44` }} />
      <div className="relative w-11 h-11 md:w-12 md:h-12">
        <div
          className="absolute inset-0 rounded-[10%] border border-white/15"
          style={{
            background: `linear-gradient(135deg, ${highlight}, ${shadow})`,
            boxShadow: `0 10px 20px ${shadow}33 inset, 0 0 18px ${baseColor}33`,
          }}
        />
        <div
          className="absolute -top-3 left-1/4 w-7 h-5 md:w-8 md:h-5 -skew-x-12 origin-bottom border-t border-white/15"
          style={{
            background: `linear-gradient(135deg, ${adjustColor(baseColor, 50)}, ${highlight})`,
            boxShadow: `0 6px 12px ${baseColor}26`,
          }}
        />
        <div
          className="absolute top-2 -right-3 w-4 h-8 md:w-4 md:h-9 skew-y-12 origin-left rounded-sm border border-white/10"
          style={{
            background: `linear-gradient(180deg, ${shadow}, ${adjustColor(baseColor, -70)})`,
            boxShadow: `inset -4px 0 10px ${shadow}55`,
          }}
        />
      </div>
    </div>
  );

  const triangle = (
    <div className={commonContainer}>
      <div className="absolute inset-0" style={{ boxShadow: `0 0 25px ${baseColor}33` }} />
      <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-end justify-center">
        <div
          className="absolute bottom-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: '22px solid transparent',
            borderRight: '22px solid transparent',
            borderBottom: `36px solid ${baseColor}`,
            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.4))',
          }}
        />
        <div
          className="absolute bottom-1 right-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: '0 solid transparent',
            borderRight: '18px solid transparent',
            borderBottom: `28px solid ${shadow}`,
            transform: 'skewX(-10deg)',
          }}
        />
        <div
          className="absolute bottom-1 left-1"
          style={{
            width: 0,
            height: 0,
            borderLeft: '18px solid transparent',
            borderRight: '0 solid transparent',
            borderBottom: `28px solid ${adjustColor(baseColor, 35)}`,
            transform: 'skewX(10deg)',
          }}
        />
        <div className="absolute bottom-5 w-6 h-6 md:w-7 md:h-7 bg-white/15 rounded-full blur-md" />
      </div>
    </div>
  );

  const shapeNode = {
    circle,
    square,
    triangle,
  }[shape];

  return (
    <div
      className={clsx(
        'flex flex-col items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-lg shadow-[0_0_25px_rgba(255,255,255,0.04)]',
        className,
      )}
    >
      {shapeNode}
      {label && <div className="text-[11px] text-gray-300 text-center leading-tight">{label}</div>}
    </div>
  );
}
