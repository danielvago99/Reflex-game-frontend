import { Download, FileText, AlertTriangle, ArrowRight, Shield } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { WalletInput } from './WalletInput';
import { type EncryptedWalletRecord } from '../../utils/walletCrypto';
import { WalletStepLayout } from './WalletStepLayout';

interface ImportWalletScreenProps {
  onImportSeed: (seedPhrase: string[], password: string) => Promise<void>;
  onImportKeystore: (record: EncryptedWalletRecord, password: string) => Promise<void>;
  onBack: () => void;
}

export function ImportWalletScreen({ onImportSeed, onImportKeystore, onBack }: ImportWalletScreenProps) {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedPassword, setSeedPassword] = useState('');
  const [keystoreFile, setKeystoreFile] = useState<File | null>(null);
  const [keystorePassword, setKeystorePassword] = useState('');
  const [activeTab, setActiveTab] = useState('seed');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setKeystoreFile(e.target.files[0]);
    }
  };

  const words = seedPhrase.trim().split(/\s+/).filter(Boolean);
  const canContinueSeed =
    (words.length === 12 || words.length === 24) && seedPassword.length >= 8;
  const canContinueKeystore = keystoreFile !== null && keystorePassword.length > 0;

  const handleImport = async () => {
    setProcessing(true);
    setErrorMessage('');

    try {
      if (activeTab === 'seed') {
        await onImportSeed(words, seedPassword);
      } else {
        if (!keystoreFile) {
          throw new Error('Please upload a valid keystore file');
        }

        const fileText = await keystoreFile.text();
        const parsed = JSON.parse(fileText) as EncryptedWalletRecord;
        await onImportKeystore(parsed, keystorePassword);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to import wallet');
      setProcessing(false);
      return;
    }

    setProcessing(false);
  };

  return (
    <WalletStepLayout
      title="Recover Wallet"
      subtitle="Restore your wallet using recovery methods"
      icon={(
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#00FFA3] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#00FFA3] blur-xl opacity-50"></div>
          <Download className="w-8 h-8 sm:w-10 sm:h-10 text-white relative" />
        </div>
      )}
      background={(
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
        </div>
      )}
      actions={(
        <>
          <WalletButton
            onClick={handleImport}
            icon={ArrowRight}
            disabled={processing || (activeTab === 'seed' ? !canContinueSeed : !canContinueKeystore)}
          >
            {processing ? 'Importing...' : 'Import Wallet'}
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back to Unlock
          </WalletButton>
        </>
      )}
    >
      <div className="space-y-3 sm:space-y-6">
        <WalletAlert variant="danger" title="Security Warning">
          <ul className="space-y-1 mt-1 sm:mt-2 text-sm sm:text-base">
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
              <span>Never share your seed phrase or keystore</span>
            </li>
          </ul>
        </WalletAlert>

        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#7C3AED]/20 blur-sm rounded-lg"></div>
          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#06B6D4] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white text-sm sm:text-base mb-1">Verify Domain</h4>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Always check the URL before importing. Phishing sites may steal your wallet.
                </p>
                <code className="text-[#00FFA3] text-xs mt-2 block break-all">
                  {window.location.hostname}
                </code>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 text-sm sm:text-base">
            <TabsTrigger value="seed" className="data-[state=active]:bg-[#00FFA3]/20 data-[state=active]:text-[#00FFA3]">
              Seed Phrase
            </TabsTrigger>
            <TabsTrigger value="keystore" className="data-[state=active]:bg-[#00FFA3]/20 data-[state=active]:text-[#00FFA3]">
              Keystore File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="seed" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
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
                  className="relative w-full bg-white/5 backdrop-blur-lg border border-white/10 focus:border-[#00FFA3] text-white px-4 py-3 rounded-lg outline-none transition-all placeholder:text-gray-500 resize-none text-sm sm:text-base"
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
          </TabsContent>

          <TabsContent value="keystore" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-300 uppercase tracking-wider">
                  Upload Keystore File
                </label>
                <div className="relative">
                  <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg blur-sm"></div>
                  <label className="relative block bg-white/5 backdrop-blur-lg border-2 border-dashed border-white/10 hover:border-[#00FFA3]/50 rounded-lg p-6 sm:p-8 cursor-pointer transition-all">
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="text-center space-y-2">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500 mx-auto" />
                      {keystoreFile ? (
                        <>
                          <p className="text-[#00FFA3] text-sm sm:text-base">{keystoreFile.name}</p>
                          <p className="text-xs text-gray-400">Click to change file</p>
                        </>
                      ) : (
                        <>
                          <p className="text-white text-sm sm:text-base">Click to upload</p>
                          <p className="text-xs text-gray-400">JSON files only</p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {keystoreFile && (
                <div className="space-y-2">
                  <label className="text-sm text-gray-300 uppercase tracking-wider">
                    Keystore Password
                  </label>
                  <div className="relative">
                    <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg blur-sm"></div>
                    <input
                      type="password"
                      value={keystorePassword}
                      onChange={(e) => setKeystorePassword(e.target.value)}
                      placeholder="Enter keystore password"
                      className="relative w-full bg-white/5 backdrop-blur-lg border border-white/10 focus:border-[#00FFA3] text-white px-4 py-3 rounded-lg outline-none transition-all placeholder:text-gray-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              )}
            </div>

            <WalletAlert variant="info">
              The keystore file is encrypted with your password. Make sure you have the correct password to decrypt it.
            </WalletAlert>
          </TabsContent>
        </Tabs>

        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-br from-orange-500/30 to-red-500/30 blur-sm rounded-lg"></div>
          <div className="relative bg-orange-500/5 backdrop-blur-lg border border-orange-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-300 space-y-1">
                <p className="text-orange-300 mb-1">Beware of Phishing</p>
                <p className="text-xs sm:text-sm leading-relaxed">
                  Never import your wallet on suspicious websites. Always verify the URL and ensure you're on the official domain.
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMessage && (
          <WalletAlert variant="danger">{errorMessage}</WalletAlert>
        )}
      </div>
    </WalletStepLayout>
  );
}