import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  noBorder?: boolean;
}

export function GlassPanel({ children, className = '', noBorder = false }: GlassPanelProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Main glassmorphism container */}
      <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.03] backdrop-blur-md rounded-2xl overflow-hidden">
        {/* Gradient border */}
        {!noBorder && (
          <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-br from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] opacity-40">
            <div className="absolute inset-[2px] bg-[#0B0F1A]/90 rounded-2xl" />
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 p-6">{children}</div>

        {/* Corner tech details */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00FFA3]/60" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#06B6D4]/60" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#7C3AED]/60" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00FFA3]/60" />
      </div>

      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3]/10 via-[#06B6D4]/10 to-[#7C3AED]/10 blur-xl -z-10 rounded-2xl" />
    </div>
  );
}
