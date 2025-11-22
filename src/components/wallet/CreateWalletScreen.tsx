import { Shield, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { WalletCard } from './WalletCard';
import { WalletAlert } from './WalletAlert';

interface CreateWalletScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function CreateWalletScreen({ onContinue, onBack }: CreateWalletScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/2 w-96 h-96 bg-[#06B6D4] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 md:py-6 gap-4 md:gap-5">
        {/* Step Progress */}
        <div className="mb-2 md:mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">Step 1 of 5</span>
            <span className="text-xs md:text-sm text-[#00FFA3]">20%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-1/5 transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] mb-3 md:mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50"></div>
            <Shield className="w-9 h-9 md:w-10 md:h-10 text-white relative animate-pulse" />
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1 md:mb-2">Create Wallet</h1>
          <p className="text-sm md:text-base text-gray-400">Your secure, non-custodial Solana wallet</p>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Info Card - Local Encryption */}
          <WalletCard>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#00FFA3]/10 rounded-lg border border-[#00FFA3]/20">
                <Shield className="w-6 h-6 text-[#00FFA3]" />
              </div>
              <div className="flex-1">
                <h3 className="text-white mb-2">Local Encryption</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Your wallet will be encrypted locally on this device using <span className="text-[#00FFA3]">AES-256-GCM</span> encryption. Your password never leaves your device.
                </p>
              </div>
            </div>
          </WalletCard>

          {/* BIP-39 Info */}
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#06B6D4] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white text-sm mb-1">BIP-39 Standard</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  We'll generate a 12-word <span className="text-[#06B6D4]">seed phrase</span> using the industry-standard BIP-39 protocol. This phrase is the master key to your wallet.
                </p>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="space-y-3">
            <h3 className="text-sm text-gray-400 uppercase tracking-widest">Security Features</h3>
            <div className="space-y-2">
              {[
                { icon: '🔐', text: 'Password-protected encryption' },
                { icon: '🔑', text: 'Biometric unlock' },

              ].map((feature, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all"
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-sm text-gray-300">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <WalletAlert variant="warning">
            You are responsible for keeping your seed phrase safe. If you lose it, you lose access to your wallet. We cannot recover it for you.
          </WalletAlert>
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <WalletButton
            onClick={onContinue}
            icon={ArrowRight}
          >
            Continue
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back
          </WalletButton>
        </div>
      </div>
    </div>
  );
}