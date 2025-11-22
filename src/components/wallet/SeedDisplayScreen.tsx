import { Eye, EyeOff, Copy, Download, ArrowRight, Shield, Check } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { Checkbox } from '../ui/checkbox';
import { copyToClipboard } from '../../utils/clipboard';
import { WalletStepLayout } from './WalletStepLayout';

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
    <WalletStepLayout
      title="Your Seed Phrase"
      subtitle="Write this down and store it safely"
      step={3}
      totalSteps={5}
      icon={(
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-xl opacity-50 animate-pulse"></div>
          <Shield className="w-9 h-9 sm:w-10 sm:h-10 text-[#0B0F1A] relative" />
        </div>
      )}
      background={(
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
        </div>
      )}
      actions={(
        <>
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
        </>
      )}
    >
      <div className="space-y-4 sm:space-y-6">
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

        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur-sm rounded-xl"></div>
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 sm:p-6 overflow-hidden">
            {!isRevealed ? (
              <div className="text-center py-10 sm:py-12">
                <EyeOff className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-6 leading-relaxed text-sm sm:text-base">
                  Your seed phrase is hidden for security.
                  <br />
                  Click below to reveal it.
                </p>
                <WalletButton onClick={handleReveal} variant="secondary" fullWidth={false} className="mx-auto">
                  <Eye className="w-5 h-5" />
                  Reveal Seed Phrase
                </WalletButton>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                  {seedPhrase.map((word, index) => (
                    <div key={index} className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="text-xs text-gray-500 mb-1">#{index + 1}</div>
                      <div className="text-white text-sm sm:text-base">{word}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCopy}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFA3]/50 text-white p-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFA3]/50 text-white p-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Download</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

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

        {isRevealed && (
          <div className="flex items-start gap-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 sm:p-5">
            <Checkbox
              checked={saved}
              onCheckedChange={(checked) => setSaved(checked as boolean)}
              className="mt-0.5 border-white/30 data-[state=checked]:bg-[#00FFA3] data-[state=checked]:border-[#00FFA3]"
            />
            <label className="text-sm sm:text-base text-gray-300 leading-relaxed flex-1 cursor-pointer" onClick={() => setSaved(!saved)}>
              I have saved my seed phrase securely. I understand that I cannot recover my wallet without it.
            </label>
          </div>
        )}
      </div>
    </WalletStepLayout>
  );
}
