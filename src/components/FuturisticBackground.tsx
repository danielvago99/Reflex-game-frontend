export function FuturisticBackground({ animated = true }: { animated?: boolean }) {
  return (
    <>
      {/* Static grid pattern - no animation needed */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 163, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 163, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Animated gradient orbs - uses CSS transforms only */}
      {animated ? (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute -top-1/2 -left-1/2 w-full h-full opacity-20"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 255, 163, 0.4), transparent 50%)',
              animation: 'drift 20s ease-in-out infinite',
              willChange: 'transform'
            }}
          />
          <div 
            className="absolute -bottom-1/2 -right-1/2 w-full h-full opacity-20"
            style={{
              background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.4), transparent 50%)',
              animation: 'drift 25s ease-in-out infinite reverse',
              willChange: 'transform'
            }}
          />
          <div 
            className="absolute top-1/2 left-1/2 w-3/4 h-3/4 opacity-15"
            style={{
              background: 'radial-gradient(circle at center, rgba(6, 182, 212, 0.4), transparent 50%)',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse-slow 15s ease-in-out infinite',
              willChange: 'opacity'
            }}
          />
        </div>
      ) : (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-96 h-96 opacity-15"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 255, 163, 0.4), transparent 70%)'
            }}
          />
          <div 
            className="absolute bottom-1/4 right-1/4 w-96 h-96 opacity-15"
            style={{
              background: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.4), transparent 70%)'
            }}
          />
        </div>
      )}

      {/* Minimal accent lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FFA3]/30 to-transparent" />
        <div className="absolute bottom-[15%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#06B6D4]/30 to-transparent" />
        <div className="absolute top-0 left-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#7C3AED]/20 to-transparent" />
        <div className="absolute top-0 right-[20%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#00FFA3]/20 to-transparent" />
      </div>

      {/* Corner decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-[#00FFA3]/40" />
        <div className="absolute top-4 right-4 w-12 h-12 border-t border-r border-[#06B6D4]/40" />
        <div className="absolute bottom-4 left-4 w-12 h-12 border-b border-l border-[#7C3AED]/40" />
        <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-[#00FFA3]/40" />
      </div>

      {/* Minimal particle grid - CSS only */}
      {animated && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div 
            className="absolute top-[10%] left-[10%] w-1 h-1 rounded-full bg-[#00FFA3]"
            style={{ animation: 'twinkle 3s ease-in-out infinite' }}
          />
          <div 
            className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-[#06B6D4]"
            style={{ animation: 'twinkle 4s ease-in-out infinite 0.5s' }}
          />
          <div 
            className="absolute bottom-[30%] left-[20%] w-1 h-1 rounded-full bg-[#7C3AED]"
            style={{ animation: 'twinkle 3.5s ease-in-out infinite 1s' }}
          />
          <div 
            className="absolute bottom-[15%] right-[25%] w-1 h-1 rounded-full bg-[#00FFA3]"
            style={{ animation: 'twinkle 4.5s ease-in-out infinite 1.5s' }}
          />
          <div 
            className="absolute top-[60%] left-[70%] w-1 h-1 rounded-full bg-[#06B6D4]"
            style={{ animation: 'twinkle 3.2s ease-in-out infinite 2s' }}
          />
          <div 
            className="absolute top-[40%] right-[60%] w-1 h-1 rounded-full bg-[#7C3AED]"
            style={{ animation: 'twinkle 3.8s ease-in-out infinite 2.5s' }}
          />
        </div>
      )}

      {/* Noise overlay - static, minimal impact */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' /%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}
      />
    </>
  );
}