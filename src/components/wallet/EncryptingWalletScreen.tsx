import { Lock, Shield, Key } from 'lucide-react';
import { useEffect, useState } from 'react';
import { WalletStepLayout } from './WalletStepLayout';
import { WalletButton } from './WalletButton';

interface EncryptingWalletScreenProps {
  onComplete: () => void;
}

export function EncryptingWalletScreen({ onComplete }: EncryptingWalletScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  const stages = [
    { text: 'Generating encryption keys...', duration: 800 },
    { text: 'Encrypting seed phrase with AES-256-GCM...', duration: 1200 },
    { text: 'Securing wallet locally...', duration: 800 },
    { text: 'Finalizing...', duration: 600 },
  ];

  useEffect(() => {
    let currentProgress = 0;
    let currentStage = 0;
    const totalDuration = stages.reduce((sum, s) => sum + s.duration, 0);
    const interval = 30; // Update every 30ms

    const timer = setInterval(() => {
      currentProgress += (interval / totalDuration) * 100;
      
      // Calculate current stage based on progress
      let cumulativeDuration = 0;
      for (let i = 0; i < stages.length; i++) {
        cumulativeDuration += stages[i].duration;
        if ((currentProgress / 100) * totalDuration < cumulativeDuration) {
          currentStage = i;
          break;
        }
      }
      
      setProgress(Math.min(currentProgress, 100));
      setStage(currentStage);

      if (currentProgress >= 100) {
        clearInterval(timer);
        setTimeout(onComplete, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <WalletStepLayout
      title="Encrypting Wallet"
      subtitle="Your wallet is being secured locally"
      step={5}
      totalSteps={5}
      progressPercent={progress}
      icon={(
        <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-3xl opacity-30 animate-pulse"></div>
          <Lock className="w-9 h-9 sm:w-11 sm:h-11 text-[#0B0F1A]" />
        </div>
      )}
      background={(
        <>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#7C3AED] opacity-20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#00FFA3] opacity-20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3.5 h-3.5 border border-[#00FFA3]/30 rotate-45"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                }}
              />
            ))}
          </div>
        </>
      )}
      actions={(
        <WalletButton icon={Lock} disabled>
          Securing Wallet...
        </WalletButton>
      )}
    >
      <div className="space-y-3 sm:space-y-6">
        <div className="text-center flex flex-col items-center gap-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
              <Shield className="w-24 h-24 sm:w-28 sm:h-28 text-[#00FFA3]/20" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] animate-pulse">
              <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-[#0B0F1A]" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
              <Key className="w-5 h-5 sm:w-6 sm:h-6 text-[#06B6D4] absolute -top-2" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '5s', animationDirection: 'reverse' }}>
              <Key className="w-5 h-5 sm:w-6 sm:h-6 text-[#7C3AED] absolute -bottom-2" />
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-300">{stages[stage]?.text}</p>
        </div>

        <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 sm:p-5">
          <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00FFA3] via-[#06B6D4] to-[#7C3AED] transition-all duration-300 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
          <div className="mt-2 text-right">
            <span className="text-xs sm:text-sm text-[#00FFA3]">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#00FFA3] mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-white text-sm sm:text-base">Military-Grade Encryption</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Your seed phrase is being encrypted with AES-256-GCM. Only you can decrypt it with your password.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {stages.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                i < stage ? 'text-[#00FFA3]' :
                i === stage ? 'text-white' : 'text-gray-600'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                i < stage ? 'border-[#00FFA3] bg-[#00FFA3]' :
                i === stage ? 'border-[#00FFA3] animate-pulse' : 'border-gray-600'
              }`}>
                {i < stage && (
                  <svg className="w-3 h-3 text-[#0B0F1A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                )}
              </div>
              <span className="text-xs sm:text-sm">{s.text.replace('...', '')}</span>
            </div>
          ))}
        </div>
      </div>
    </WalletStepLayout>
  );
}
