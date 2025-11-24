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
          'relative w-5 h-5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md overflow-visible flex items-center justify-center',
          shapeGlows[shape],
        )}
      >
        {shape === 'circle' && (
          <div className="relative w-4 h-4">
            <div className="absolute -inset-1 rounded-full bg-cyan-300/25 blur-sm"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-200/90 via-cyan-400/90 to-teal-500/90"></div>
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-white/90 via-cyan-100/80 to-cyan-400/70 opacity-90"></div>
            <div className="absolute inset-[5px] rounded-full bg-white/80 opacity-80 blur-[1px]"></div>
            <div className="absolute right-0.5 top-0.5 w-1.5 h-1.5 rounded-full bg-white/85 blur-[1px] opacity-90"></div>
          </div>
        )}

        {shape === 'square' && (
          <div className="relative w-4 h-4 -rotate-6">
            <div className="absolute -inset-1 rounded-md bg-purple-400/25 blur-[3px]"></div>
            <div className="absolute inset-0 rounded-[3px] bg-gradient-to-br from-purple-400 via-purple-500 to-purple-700"></div>
            <div className="absolute inset-0 rounded-[3px] bg-gradient-to-br from-purple-200/90 to-purple-500/90 mix-blend-screen"></div>
            <div className="absolute inset-0 rounded-[3px] translate-x-[2px] translate-y-[2px] skew-x-[-8deg] skew-y-[6deg] bg-gradient-to-br from-purple-900/70 via-purple-800/60 to-purple-700/60 opacity-90"></div>
            <div className="absolute -top-1 left-[2px] right-[2px] h-[7px] origin-bottom skew-x-[-12deg] scale-y-75 rounded-[3px] bg-gradient-to-br from-purple-200/90 via-purple-400/90 to-purple-600/90"></div>
            <div className="absolute top-[6px] left-1 right-1 h-[10px] rounded-[3px] bg-gradient-to-br from-purple-600/80 to-purple-800/90 opacity-80 mix-blend-multiply"></div>
          </div>
        )}

        {shape === 'triangle' && (
          <div className="relative w-4 h-4">
            <div className="absolute -inset-1 rounded-md bg-amber-300/25 blur-[3px]"></div>
            <div className="absolute left-1/2 bottom-[1px] -translate-x-1/2 border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-amber-400/80"></div>
            <div className="absolute left-1/2 bottom-[1px] -translate-x-1/2 translate-x-[2px] border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-amber-500/80 opacity-90 skew-x-[-6deg]"></div>
            <div className="absolute left-1/2 bottom-[1px] -translate-x-1/2 -translate-x-[2px] border-l-[8px] border-r-[8px] border-b-[14px] border-l-transparent border-r-transparent border-b-orange-500/80 opacity-85 skew-x-[6deg]"></div>
            <div className="absolute left-1/2 top-[2px] -translate-x-1/2 w-[6px] h-[6px] bg-gradient-to-br from-yellow-200 to-orange-200 rounded-sm opacity-90 blur-[0.5px]"></div>
            <div className="absolute left-1/2 top-[6px] -translate-x-1/2 w-[12px] h-[3px] bg-orange-500/60 blur-[2px] opacity-70"></div>
          </div>
        )}
      </div>

      {label && <span className="text-xs text-gray-200">{label}</span>}
    </div>
  );
}
