export function FuturisticBackground({ animated = true }: { animated?: boolean }) {
  return (
    <>
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 163, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 163, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Hexagonal Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `radial-gradient(circle at 25px 25px, rgba(124, 58, 237, 0.3) 2px, transparent 0)`,
        backgroundSize: '50px 50px'
      }}></div>

      {/* Scanlines Effect */}
      {animated && (
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 163, 0.5) 3px)',
            animation: 'scan 8s linear infinite'
          }}></div>
        </div>
      )}

      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`
      }}></div>

      {/* Animated Circuit Lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top horizontal line */}
        <div className={`absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent opacity-30 ${animated ? 'animate-pulse' : ''}`}></div>
        {/* Vertical line left */}
        <div className="absolute top-0 left-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#06B6D4] to-transparent opacity-20"></div>
        {/* Vertical line right */}
        <div className="absolute top-0 right-[15%] w-[1px] h-full bg-gradient-to-b from-transparent via-[#7C3AED] to-transparent opacity-20"></div>
        {/* Bottom horizontal line */}
        <div className={`absolute bottom-[25%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#06B6D4] to-transparent opacity-30 ${animated ? 'animate-pulse' : ''}`} style={animated ? { animationDelay: '1s' } : {}}></div>
        
        {/* Corner Tech Details */}
        <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-[#00FFA3]/30"></div>
        <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-[#06B6D4]/30"></div>
        <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-[#7C3AED]/30"></div>
        <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-[#00FFA3]/30"></div>
      </div>

      {/* Floating Particles */}
      {animated && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#00FFA3] rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 5}s`
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Static Particles (when not animated) */}
      {!animated && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#00FFA3] rounded-full opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Animated background effects - Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 bg-[#00FFA3] opacity-20 rounded-full blur-[100px] ${animated ? 'animate-pulse' : ''}`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#7C3AED] opacity-20 rounded-full blur-[100px] ${animated ? 'animate-pulse delay-700' : ''}`}></div>
        <div className={`absolute top-1/2 left-1/2 w-56 h-56 bg-[#06B6D4] opacity-15 rounded-full blur-[100px] ${animated ? 'animate-pulse delay-1000' : ''}`}></div>
      </div>
    </>
  );
}