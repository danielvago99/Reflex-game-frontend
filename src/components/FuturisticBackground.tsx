import React from 'react';

interface CyberCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function CyberCard({ children, className = "", variant = 'primary' }: CyberCardProps) {
  // Rozhodneme o farbách podľa variantu
  const glowClasses = variant === 'primary'
    ? "from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] group-hover:opacity-100 group-hover:blur-md"
    : "from-white/10 to-white/5 opacity-20";

  return (
    <div className={`relative group ${className}`}>
      {/* 1. Vonkajšia žiara (Glow Border) */}
      <div 
        className={`absolute -inset-[1px] bg-gradient-to-b rounded-xl opacity-50 blur-sm transition-all duration-500 ${glowClasses}`}
        style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
        }}
      />

      {/* 2. Hlavný kontajner obsahu */}
      <div 
        className="relative bg-[#0B0F1A]/80 backdrop-blur-xl border border-white/10 p-6 h-full"
        style={{
            clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
        }}
      >
        {/* Rohové dekorácie */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00FFA3]/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#06B6D4]/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#7C3AED]/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00FFA3]/50" />

        {/* Samotný obsah */}
        {children}
      </div>
    </div>
  );
}