import { LucideIcon } from 'lucide-react';

interface WalletButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
  className?: string;
}

export function WalletButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  icon: Icon,
  fullWidth = true,
  className = ''
}: WalletButtonProps) {
  const baseStyles = "relative py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";
  
  const variants = {
    primary: "bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] text-[#0B0F1A] shadow-xl",
    secondary: "glass text-white hover:bg-white/10 hover:scale-105",
    danger: "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] text-white shadow-xl"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span className="text-lg">{children}</span>
    </button>
  );
}
