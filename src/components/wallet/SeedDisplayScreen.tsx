import { Eye, EyeOff, Copy, Download, ArrowRight, AlertTriangle, Shield, Lock } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { Checkbox } from '../ui/checkbox';
import { copyToClipboard } from '../../utils/clipboard';

interface SeedDisplayScreenProps {
  seedPhrase: string[];
  onContinue: () => void;
  onBack: () => void;
  walletAddress?: string;
}

export function SeedDisplayScreen({ seedPhrase, onContinue, onBack, walletAddress }: SeedDisplayScreenProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(seedPhrase.join(' '));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    // Create wallet data object
    const walletData = {
      wallet_type: 'Solana',
      wallet_address: walletAddress || 'Not available',
      seed_phrase: seedPhrase.join(' '),
      created_at: new Date().toISOString(),
      network: 'mainnet-beta',
      warning: 'KEEP THIS FILE SECURE! Anyone with access to this file can control your wallet and funds.',
    };

    // Convert to JSON and create blob
    const jsonString = JSON.stringify(walletData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `solana-wallet-${walletAddress?.slice(0, 8) || 'backup'}.json`;
    a.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
  };

  const canContinue = isRevealed && saved;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 md:py-6 gap-4 md:gap-5">
        {/* Step Progress */}
        <div className="mb-2 md:mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">Step 3 of 5</span>
            <span className="text-xs md:text-sm text-[#00FFA3]">60%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-3/5 transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] mb-3 md:mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50 animate-pulse"></div>
            <Shield className="w-9 h-9 md:w-10 md:h-10 text-[#0B0F1A] relative" />
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1 md:mb-2">Your Seed Phrase</h1>
          <p className="text-sm md:text-base text-gray-400">Write this down and store it safely</p>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Critical warning */}
          <WalletAlert variant="danger" title="Never Share Your Seed Phrase">
            <ul className="space-y-2 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Anyone with your seed phrase can steal your funds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>We will never ask for your seed phrase</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Store it offline in a secure location</span>
              </li>
            </ul>
          </WalletAlert>

          {/* Seed phrase display */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur-sm rounded-xl"></div>
            <div className="relative glass rounded-xl p-5 md:p-6 overflow-hidden">
              <div className="min-h-[360px] md:min-h-[380px] flex flex-col">
                {!isRevealed ? (
                  <div className="flex flex-1 flex-col items-center justify-center text-center gap-4 py-6">
                    <EyeOff className="w-12 h-12 text-gray-500" />
                    <p className="text-gray-400">
                      Your seed phrase is hidden for security.<br />
                      Click below to reveal it.
                    </p>
                    <WalletButton onClick={handleReveal} variant="secondary" fullWidth={false} className="mx-auto">
                      <Eye className="w-5 h-5" />
                      Reveal Seed Phrase
                    </WalletButton>
                  </div>
                ) : (
                  <div className="flex flex-1 flex-col">
                    <div className="grid grid-cols-3 gap-2.5 md:gap-3 mb-4 md:mb-5">
                      {seedPhrase.map((word, index) => (
                        <div key={index} className="glass rounded-lg p-3">
                          <div className="text-xs font-semibold text-[#00FFA3] mb-1">#{index + 1}</div>
                          <div className="text-white">{word}</div>
                        </div>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2.5 md:gap-3 mt-auto">
                      <button
                        onClick={handleCopy}
                        className="glass rounded-lg p-3 transition-all flex items-center justify-center gap-2 hover:bg-white/10 hover:scale-105 text-white"
                      >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={handleDownload}
                        className="glass rounded-lg p-3 transition-all flex items-center justify-center gap-2 hover:bg-white/10 hover:scale-105 text-white"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-sm">Download</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Storage tips */}
          {isRevealed && (
            <WalletAlert variant="info" title="Storage Best Practices">
              <ul className="space-y-1 mt-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3]">✓</span>
                  <span>Write it down on paper and store in a safe</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3]">✓</span>
                  <span>Make multiple copies in different secure locations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>Don't store in cloud services or take screenshots</span>
                </li>
              </ul>
            </WalletAlert>
          )}

          {/* Confirmation */}
          {isRevealed && (
            <div className="flex items-start gap-3 glass rounded-lg p-4">
              <Checkbox 
                checked={saved}
                onCheckedChange={(checked) => setSaved(checked as boolean)}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[#00FFA3] data-[state=checked]:border-[#00FFA3]"
              />
              <label className="text-sm text-gray-300 leading-relaxed flex-1 cursor-pointer" onClick={() => setSaved(!saved)}>
                I have saved my seed phrase securely. I understand that I cannot recover my wallet without it.
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <WalletButton
            onClick={onContinue}
            icon={ArrowRight}
            disabled={!canContinue}
          >
            Continue to Verification
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back
          </WalletButton>
        </div>
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
