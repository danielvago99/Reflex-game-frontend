interface WalletCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  className?: string;
}

export function WalletCard({ children, variant = 'default', className = '' }: WalletCardProps) {
  const variants = {
    default: {
      glow: 'from-[#00FFA3]/20 to-[#06B6D4]/20',
      surface: 'glass'
    },
    warning: {
      glow: 'from-orange-500/30 to-yellow-500/30',
      surface: 'bg-orange-500/5 backdrop-blur-lg border border-orange-500/30'
    },
    success: {
      glow: 'from-[#00FFA3]/30 to-green-500/30',
      surface: 'bg-[#00FFA3]/5 backdrop-blur-lg border border-[#00FFA3]/30'
    },
    danger: {
      glow: 'from-red-500/30 to-red-600/30',
      surface: 'bg-red-500/5 backdrop-blur-lg border border-red-500/30'
    }
  };

  const style = variants[variant];

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute -inset-px bg-gradient-to-br ${style.glow} blur-sm`} style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}></div>
      <div className={`relative ${style.surface} overflow-hidden`} style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        {children}
      </div>
    </div>
  );
}
