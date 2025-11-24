import clsx from 'clsx';

export interface Fake3DShapePreviewProps {
  shape: 'circle' | 'square' | 'triangle';
  label?: string;
}

const shapeGlows: Record<Fake3DShapePreviewProps['shape'], string> = {
  circle: 'shadow-[0_0_25px_rgba(34,211,238,0.4)]',
  square: 'shadow-[0_0_25px_rgba(124,58,237,0.4)]',
  triangle: 'shadow-[0_0_22px_rgba(234,179,8,0.45)]',
};

export function Fake3DShapePreview({ shape, label }: Fake3DShapePreviewProps) {
  return (
    <div className={clsx('inline-flex items-center', label ? 'gap-2' : '')}>
      <div
        className={clsx(
          'relative w-6 h-6 rounded-lg bg-gradient-to-b from-white/15 to-white/5 border border-white/15 backdrop-blur-md overflow-visible flex items-center justify-center',
          shapeGlows[shape],
        )}
      >
        {shape === 'circle' && (
          <div className="relative w-[18px] h-[18px]">
            <div className="absolute -inset-1.5 rounded-full bg-cyan-300/35 blur-md"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200 via-cyan-400 to-teal-500"></div>
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/90 via-cyan-100/80 to-cyan-400/80"></div>
            <div className="absolute inset-[6px] rounded-full bg-white/85 opacity-90 blur-[1.5px]"></div>
            <div className="absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-white/95 blur-[1px]"></div>
          </div>
        )}

        {shape === 'square' && (
          <div className="relative w-[18px] h-[18px] -rotate-6">
            <div className="absolute -inset-1 rounded-md bg-purple-300/35 blur-[3px]"></div>
            <div className="absolute inset-0 rounded-[4px] bg-gradient-to-br from-purple-400 via-purple-500 to-purple-800"></div>
            <div className="absolute inset-0 rounded-[4px] bg-gradient-to-br from-purple-200/90 to-purple-500/90 mix-blend-screen"></div>
            <div className="absolute inset-0 rounded-[4px] translate-x-[2px] translate-y-[2px] skew-x-[-8deg] skew-y-[6deg] bg-gradient-to-br from-purple-900/80 via-purple-800/70 to-purple-700/70 opacity-95"></div>
            <div className="absolute -top-[5px] left-[3px] right-[3px] h-[7px] origin-bottom skew-x-[-12deg] scale-y-75 rounded-[4px] bg-gradient-to-br from-purple-200/95 via-purple-400/95 to-purple-700/90"></div>
            <div className="absolute top-[7px] left-[5px] right-[5px] h-[10px] rounded-[4px] bg-gradient-to-br from-purple-600/85 to-purple-900/95 opacity-80 mix-blend-multiply"></div>
          </div>
        )}

        {shape === 'triangle' && (
          <div className="relative w-[18px] h-[18px]">
            <div className="absolute -inset-1.5 rounded-md bg-amber-300/35 blur-[3px]"></div>
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-amber-400"></div>
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-x-[2px] border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-amber-500 opacity-90 skew-x-[-7deg]"></div>
            <div className="absolute left-1/2 bottom-0 -translate-x-1/2 -translate-x-[2px] border-l-[9px] border-r-[9px] border-b-[15px] border-l-transparent border-r-transparent border-b-orange-500 opacity-85 skew-x-[7deg]"></div>
            <div className="absolute left-1/2 top-[2px] -translate-x-1/2 w-[7px] h-[7px] bg-gradient-to-br from-yellow-200 to-orange-200 rounded-sm opacity-90 blur-[0.5px]"></div>
            <div className="absolute left-1/2 top-[7px] -translate-x-1/2 w-[14px] h-[3px] bg-orange-500/70 blur-[2px] opacity-80"></div>
          </div>
        )}
      </div>

      {label && <span className="text-xs text-gray-200">{label}</span>}
    </div>
  );
}
