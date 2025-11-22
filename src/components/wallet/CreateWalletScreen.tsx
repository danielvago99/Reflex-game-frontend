import { Shield, ArrowRight, Info } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { WalletCard } from './WalletCard';
import { WalletAlert } from './WalletAlert';
import { WalletStepLayout } from './WalletStepLayout';

interface CreateWalletScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function CreateWalletScreen({ onContinue, onBack }: CreateWalletScreenProps) {
  return (
    <WalletStepLayout
      title="Create Wallet"
      subtitle="Your secure, non-custodial Web3 wallet"
      step={1}
      totalSteps={5}
      icon={(
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50"></div>
          <Shield className="w-9 h-9 sm:w-10 sm:h-10 text-white relative animate-pulse" />
        </div>
      )}
      background={(
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 right-1/2 w-80 h-80 sm:w-96 sm:h-96 bg-[#06B6D4] opacity-10 rounded-full blur-[120px]"></div>
        </div>
      )}
      actions={(
        <>
          <WalletButton
            onClick={onContinue}
            icon={ArrowRight}
          >
            Continue
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back
          </WalletButton>
        </>
      )}
    >
      <div className="space-y-4 sm:space-y-6">
        <WalletCard>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-3 bg-[#00FFA3]/10 rounded-lg border border-[#00FFA3]/20">
              <Shield className="w-6 h-6 text-[#00FFA3]" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-white text-base sm:text-lg">Local Encryption</h3>
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Your wallet will be encrypted locally on this device using <span className="text-[#00FFA3]">AES-256-GCM</span> encryption. Your password never leaves your device.
              </p>
            </div>
          </div>
        </WalletCard>

        <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#06B6D4] mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <h4 className="text-white text-sm sm:text-base">BIP-39 Standard</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                We'll generate a 12-word <span className="text-[#06B6D4]">seed phrase</span> using the industry-standard BIP-39 protocol. This phrase is the master key to your wallet.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          <h3 className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest">Security Features</h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              { icon: '🔐', text: 'Password-protected encryption' },
              { icon: '🔑', text: 'BIP-39 seed phrase generation' },
              { icon: '💾', text: 'Local storage only - never sent to servers' },
              { icon: '🚀', text: 'Compatible with other Solana wallets' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 hover:bg-white/10 transition-all"
              >
                <span className="text-lg sm:text-xl">{feature.icon}</span>
                <span className="text-sm sm:text-base text-gray-300 leading-snug">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <WalletAlert variant="warning">
          You are responsible for keeping your seed phrase safe. If you lose it, you lose access to your wallet. We cannot recover it for you.
        </WalletAlert>
      </div>
    </WalletStepLayout>
  );
}