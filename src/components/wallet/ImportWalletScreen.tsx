import { Download, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { WalletInput } from './WalletInput';

interface ImportWalletScreenProps {
  onImportSeed: (seedPhrase: string[], password: string) => Promise<void>;
  onBack: () => void;
}

export function ImportWalletScreen({ onImportSeed, onBack }: ImportWalletScreenProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const words = seedPhrase.trim().split(/\s+/).filter(Boolean);
  const canContinueSeed =
    (words.length === 12 || words.length === 24) && seedPassword.length >= 8;

  const handleImport = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      await onImportSeed(words, seedPassword);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import wallet');
      setProcessing(false);
      return;
    }

    setProcessing(false);
  };

  return (
    <div id="page-root" className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 md:py-6 gap-4 md:gap-5">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00FFA3] mb-3 md:mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#00FFA3] blur-xl opacity-50"></div>
            <Download className="w-9 h-9 md:w-10 md:h-10 text-white relative" />
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1 md:mb-2">Recover Wallet</h1>
          <p className="text-sm md:text-base text-gray-400">Restore your wallet using your seed phrase</p>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          {/* Security warnings */}
          <WalletAlert variant="danger" title="Security Warning">
            <ul className="space-y-1 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Only import wallets on trusted devices</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Verify you're on the correct URL/domain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Never share your seed phrase with anyone</span>
              </li>
            </ul>
          </WalletAlert>

          {/* URL/Domain reminder */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#7C3AED]/20 blur-sm rounded-lg"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-white text-sm mb-1">Verify Domain</h4>
                  <p className="text-xs text-gray-400">
                    Always check the URL before importing. Phishing sites may steal your wallet.
                  </p>
                  <code className="text-[#00FFA3] text-xs mt-2 block">
                    {window.location.hostname}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Seed phrase import */}
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300 uppercase tracking-wider">
                Enter Your Seed Phrase
              </label>
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg blur-sm"></div>
                <textarea
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="Enter your 12 or 24 word seed phrase, separated by spaces"
                  rows={4}
                  className="relative w-full bg-white/5 backdrop-blur-lg border border-white/10 focus:border-[#00FFA3] text-white px-4 py-3 rounded-lg outline-none transition-all placeholder:text-gray-500 resize-none"
                />
              </div>
              <p className="text-xs text-gray-400">
                {seedPhrase.trim().split(/\s+/).filter(w => w).length} words entered
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-300 uppercase tracking-wider">
                Set Wallet Password
              </label>
              <WalletInput
                type="password"
                value={seedPassword}
                onChange={(e) => setSeedPassword(e.target.value)}
                placeholder="Create a password to secure this wallet"
              />
              <p className="text-xs text-gray-400">Minimum 8 characters required</p>
            </div>

            <WalletAlert variant="info">
              Your seed phrase should be 12 or 24 words long. Each word should be separated by a space.
            </WalletAlert>
          </div>

          {/* Phishing warning */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-orange-500/30 to-red-500/30 blur-sm rounded-lg"></div>
            <div className="relative bg-orange-500/5 backdrop-blur-lg border border-orange-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-300">
                  <p className="text-orange-300 mb-1">Beware of Phishing</p>
                  <p className="text-xs">
                    Never import your wallet on suspicious websites. Always verify the URL and ensure you're on the official domain.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4">
            <WalletAlert variant="danger">{errorMessage}</WalletAlert>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <WalletButton
            onClick={handleImport}
            icon={ArrowRight}
            disabled={processing || !canContinueSeed}
          >
            {processing ? 'Importing...' : 'Import Wallet'}
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back to Unlock
          </WalletButton>
        </div>
      </div>
    </div>
  );
}
