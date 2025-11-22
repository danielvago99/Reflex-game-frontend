import { ReactNode } from 'react';

interface WalletStepLayoutProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  step?: number;
  totalSteps?: number;
  progressPercent?: number;
  background?: ReactNode;
  contentClassName?: string;
  actions: ReactNode;
  children: ReactNode;
}

export function WalletStepLayout({
  title,
  subtitle,
  icon,
  step,
  totalSteps,
  progressPercent,
  background,
  contentClassName,
  actions,
  children,
}: WalletStepLayoutProps) {
  const computedProgress = progressPercent ?? (step && totalSteps ? Math.min(100, Math.max(0, (step / totalSteps) * 100)) : undefined);
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-4 sm:p-6 relative overflow-hidden">
      {background}
      <div className="relative z-10 max-w-md mx-auto min-h-screen flex flex-col">
        <div className="flex flex-col flex-1 pt-4 sm:pt-8 pb-4 sm:pb-8">
          {computedProgress !== undefined && (
            <div className="mb-4 sm:mb-8">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                {step && totalSteps ? (
                  <span className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-widest">Step {step} of {totalSteps}</span>
                ) : (
                  <span className="text-[11px] sm:text-xs text-gray-400 uppercase tracking-widest">Progress</span>
                )}
                <span className="text-[11px] sm:text-xs text-[#00FFA3]">{Math.round(computedProgress)}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] transition-all duration-500"
                  style={{ width: `${computedProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="text-center mb-4 sm:mb-8 flex flex-col items-center gap-3 sm:gap-4">
            {icon}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-3xl text-white leading-tight">{title}</h1>
              {subtitle && <p className="text-sm sm:text-base text-gray-400 leading-snug">{subtitle}</p>}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className={`flex-1 overflow-y-auto space-y-3 sm:space-y-6 pr-1 ${contentClassName ?? ''}`}>{children}</div>
          </div>

          <div className="pt-3 sm:pt-6 space-y-2 sm:space-y-3 pb-[env(safe-area-inset-bottom)]">
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}
