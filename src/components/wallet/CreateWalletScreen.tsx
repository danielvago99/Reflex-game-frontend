import { Shield, ArrowRight, ArrowLeft, Info, CheckCircle2 } from 'lucide-react';
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
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 gap-4">
        {/* Progress */}
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-widest">Step 1 of 5</span>
            <span className="text-xs text-[#00FFA3]">20% complete</span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-1/5 transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-2xl opacity-50"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4]">
              <Shield className="w-10 h-10 md:w-12 md:h-12 text-[#0B0F1A]" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1">Create Wallet</h1>
          <p className="text-sm md:text-base text-gray-400">Your secure, non-custodial Web3 wallet</p>
        </div>

        <div className="flex-1 space-y-4">
          {/* Local encryption */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/25 to-[#06B6D4]/25 blur-sm rounded-xl"></div>
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
          </div>

          {/* Seed phrase overview */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#00FFA3]/20 blur-sm rounded-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#06B6D4] mt-0.5 flex-shrink-0" />
                <div className="space-y-2">
                  <div>
                    <h4 className="text-white text-sm mb-1">BIP-39 Standard</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      We'll generate a 12-word <span className="text-[#06B6D4]">seed phrase</span> using the industry-standard BIP-39 protocol. This phrase is the master key to your wallet.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00FFA3]" />
                      <span>Works offline & on-device</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00FFA3]" />
                      <span>Restores across wallets</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Security checklist */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400 uppercase tracking-widest">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
              <span>Security Features</span>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></span>
            </div>
            <div className="space-y-2.5">
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
        <div className="mt-4 sticky bottom-3 left-0 right-0">
          <div className="bg-[#0B0F1A]/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-3 space-y-2">
            <WalletButton
              onClick={onContinue}
              icon={ArrowRight}
            >
              Continue
            </WalletButton>
            <WalletButton onClick={onBack} variant="secondary" icon={ArrowLeft}>
              Back
            </WalletButton>
          </div>
        </div>
      </div>
    </div>
  );
}