import { Coins } from 'lucide-react';

interface BalanceBadgeProps {
  balance: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function BalanceBadge({ balance, size = 'md', showIcon = true }: BalanceBadgeProps) {
  const sizes = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-xl px-6 py-3'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className="relative inline-block">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] blur-md opacity-75"></div>
      <div className={`relative bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] ${sizes[size]} rounded-lg flex items-center gap-2`}>
        {showIcon && <Coins className={`${iconSizes[size]} text-[#0B0F1A]`} />}
        <span className="text-[#0B0F1A]">{balance.toFixed(4)} SOL</span>
      </div>
    </div>
  );
}
