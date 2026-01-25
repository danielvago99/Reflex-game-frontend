import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

interface WalletAlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'warning' | 'success' | 'danger';
  title?: string;
}

export function WalletAlert({ children, variant = 'info', title }: WalletAlertProps) {
  const variants = {
    info: {
      icon: Info,
      colors: 'from-[#06B6D4]/20 to-[#7C3AED]/20',
      border: 'border-[#06B6D4]/30',
      iconColor: 'text-[#06B6D4]',
      titleColor: 'text-[#06B6D4]'
    },
    warning: {
      icon: AlertTriangle,
      colors: 'from-orange-500/20 to-yellow-500/20',
      border: 'border-orange-500/30',
      iconColor: 'text-orange-400',
      titleColor: 'text-orange-300'
    },
    success: {
      icon: CheckCircle,
      colors: 'from-[#00FFA3]/20 to-green-500/20',
      border: 'border-[#00FFA3]/30',
      iconColor: 'text-[#00FFA3]',
      titleColor: 'text-[#00FFA3]'
    },
    danger: {
      icon: XCircle,
      colors: 'from-red-500/20 to-red-600/20',
      border: 'border-red-500/30',
      iconColor: 'text-red-400',
      titleColor: 'text-red-300'
    }
  };

  const style = variants[variant];
  const Icon = style.icon;

  return (
    <div className="relative">
      <div className={`absolute -inset-px bg-gradient-to-br ${style.colors} blur-sm rounded-lg`}></div>
      <div className={`relative glass ${style.border} rounded-lg p-4`}>
        <div className="flex gap-3">
          <Icon className={`w-6 h-6 ${style.iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            {title && <h4 className={`${style.titleColor} mb-1`}>{title}</h4>}
            <div className="text-sm text-gray-300 leading-relaxed">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
