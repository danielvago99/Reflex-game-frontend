import { Copy, ArrowRight, CheckCircle2, Info, Check } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { copyToClipboard } from '../../utils/clipboard';
import QRCode from 'react-qr-code';

interface WalletReadyScreenProps {
  walletAddress: string;
  onContinue: () => void;
}

export function WalletReadyScreen({ walletAddress, onContinue }: WalletReadyScreenProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(walletAddress);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 w-96 h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#06B6D4] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 md:py-6 gap-4 md:gap-5">
        {/* Step Progress */}
        <div className="mb-2 md:mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">Step 5 of 5</span>
            <span className="text-xs md:text-sm text-[#00FFA3]">100%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-full transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          {/* Success animation */}
          <div className="relative inline-block mb-3 md:mb-4">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-2xl opacity-50 animate-pulse"></div>
            <div className="relative inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4]">
              <CheckCircle2 className="w-9 h-9 md:w-10 md:h-10 text-[#0B0F1A] animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1 md:mb-2">Wallet Created!</h1>
          <p className="text-sm md:text-base text-gray-400">Your secure Web3 wallet is ready</p>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Wallet Address Section */}
          <div className="space-y-3">
            <h3 className="text-sm text-gray-400 uppercase tracking-widest">Your Solana Address</h3>
            
            {/* Address display */}
            <div className="relative glass rounded-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-white text-sm break-all font-mono">{walletAddress}</p>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-2 glass rounded-lg transition-all hover:bg-white/10 hover:scale-105"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00FFA3]" /> : <Copy className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              {copied && (
                <p className="text-xs text-[#00FFA3] animate-pulse">Copied to clipboard!</p>
              )}
            </div>

            {/* QR Code */}
            <div className="relative glass rounded-xl p-6">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-4 rounded-lg">
                  <QRCode value={walletAddress} size={180} />
                </div>
                <p className="text-xs text-gray-400 text-center">Scan to receive SOL</p>
              </div>
            </div>
          </div>

          {/* How to Fund Your Wallet */}
          <div className="space-y-3">
            <h3 className="text-sm text-gray-400 uppercase tracking-widest">How to Fund Your Wallet</h3>
            
            <div className="grid gap-3">
              {/* Step 1 */}
              <div className="relative glass rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/30 flex items-center justify-center">
                    <span className="text-xs text-[#00FFA3]">1</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm mb-1">Get SOL from an Exchange</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Purchase SOL on exchanges like Coinbase, Binance, or Kraken
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative glass rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/30 flex items-center justify-center">
                    <span className="text-xs text-[#00FFA3]">2</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm mb-1">Withdraw to Your Address</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Copy your address above and paste it as the withdrawal destination
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative glass rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/30 flex items-center justify-center">
                    <span className="text-xs text-[#00FFA3]">3</span>
                  </div>
                  <div>
                    <h4 className="text-white text-sm mb-1">Wait for Confirmation</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Transactions typically take 1-3 minutes on Solana network
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommended amount */}
              <div className="relative glass rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white text-sm mb-1">Recommended Amount</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      We recommend at least <span className="text-[#00FFA3]">0.06 SOL</span> for initial gameplay and transaction fees.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <WalletButton
            onClick={onContinue}
            icon={ArrowRight}
            fullWidth
          >
            Unlock Wallet
          </WalletButton>
        </div>
      </div>
    </div>
  );
}
