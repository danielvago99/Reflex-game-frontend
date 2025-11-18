interface WalletCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger';
  className?: string;
}

export function WalletCard({ children, variant = 'default', className = '' }: WalletCardProps) {
  const variants = {
    default: {
      glow: 'from-[#00FFA3]/20 to-[#06B6D4]/20',
      border: 'border-white/10',
      bg: 'bg-white/5'
    },
    warning: {
      glow: 'from-orange-500/30 to-yellow-500/30',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/5'
    },
    success: {
      glow: 'from-[#00FFA3]/30 to-green-500/30',
      border: 'border-[#00FFA3]/30',
      bg: 'bg-[#00FFA3]/5'
    },
    danger: {
      glow: 'from-red-500/30 to-red-600/30',
      border: 'border-red-500/30',
      bg: 'bg-red-500/5'
    }
  };

  const style = variants[variant];

  return (
    <div className={`relative ${className}`}>
      <div className={`absolute -inset-px bg-gradient-to-br ${style.glow} blur-sm`} style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}></div>
      <div className={`relative ${style.bg} backdrop-blur-lg border ${style.border} overflow-hidden`} style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        {children}
      </div>
    </div>
  );
}
