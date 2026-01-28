import { CheckCircle, ArrowRight, Shield, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';

interface SeedVerifyScreenProps {
  seedPhrase: string[];
  onContinue: () => void;
  onBack: () => void;
}

export function SeedVerifyScreen({ seedPhrase, onContinue, onBack }: SeedVerifyScreenProps) {
  const [randomIndices, setRandomIndices] = useState<number[]>([]);
  const [selectedWords, setSelectedWords] = useState<{ [key: number]: string }>({});
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [verified, setVerified] = useState(false);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    // Pick 3 random indices for verification
    const indices: number[] = [];
    while (indices.length < 3) {
      const rand = Math.floor(Math.random() * seedPhrase.length);
      if (!indices.includes(rand)) {
        indices.push(rand);
      }
    }
    setRandomIndices(indices.sort((a, b) => a - b));

    // Create shuffled options (correct words + random decoys)
    const correctWords = indices.map(i => seedPhrase[i]);
    const decoyWords: string[] = [];
    while (decoyWords.length < 6) {
      const randomWord = seedPhrase[Math.floor(Math.random() * seedPhrase.length)];
      if (!correctWords.includes(randomWord) && !decoyWords.includes(randomWord)) {
        decoyWords.push(randomWord);
      }
    }
    setShuffledOptions([...correctWords, ...decoyWords].sort(() => Math.random() - 0.5));
  }, [seedPhrase]);

  const handleSelectWord = (index: number, word: string) => {
    setSelectedWords({ ...selectedWords, [index]: word });
    setShowError(false);
  };

  const handleVerify = () => {
    const isCorrect = randomIndices.every(index => selectedWords[index] === seedPhrase[index]);
    
    if (isCorrect) {
      setVerified(true);
      setTimeout(() => {
        onContinue();
      }, 1500);
    } else {
      setShowError(true);
      // Shake animation would be applied via CSS
    }
  };

  const isCorrect = randomIndices.every(index => selectedWords[index] === seedPhrase[index]);
  const allSelected = randomIndices.every(index => selectedWords[index]);

  return (
    <div id="page-root" className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 md:py-6 gap-4 md:gap-5">
        {/* Step Progress */}
        <div className="mb-2 md:mb-4">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <span className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">Step 3.5 of 5</span>
            <span className="text-xs md:text-sm text-[#00FFA3]">70%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-[70%] transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] mb-3 md:mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-xl opacity-50 animate-pulse"></div>
            <Shield className="w-9 h-9 md:w-10 md:h-10 text-white relative" />
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1 md:mb-2">Verify Seed Phrase</h1>
          <p className="text-sm md:text-base text-gray-400">Confirm you saved it correctly</p>
        </div>

        <div className="flex-1 space-y-4 md:space-y-6">
          <WalletAlert variant="info">
            Select the correct words from your seed phrase to verify you've saved it properly.
          </WalletAlert>

          {/* Verification questions */}
          {randomIndices.map((index) => (
            <div key={index} className="space-y-3">
              <label className="text-white flex items-center gap-2 text-sm md:text-base">
                Word #{index + 1}
                {selectedWords[index] === seedPhrase[index] && (
                  <CheckCircle className="w-5 h-5 text-[#00FFA3]" />
                )}
              </label>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
                {shuffledOptions.map((word, idx) => {
                  const isSelected = selectedWords[index] === word;
                  const isCorrectWord = word === seedPhrase[index];
                  const showCorrect = isSelected && isCorrectWord;
                  const showIncorrect = isSelected && !isCorrectWord;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectWord(index, word)}
                      className={`relative p-3 md:p-4 rounded-lg border-2 text-sm md:text-base transition-all ${
                        showCorrect
                          ? 'border-[#00FFA3] bg-[#00FFA3]/10'
                          : showIncorrect
                          ? 'border-red-500 bg-red-500/10'
                          : isSelected
                          ? 'border-[#06B6D4] bg-[#06B6D4]/10'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <span className={`${
                        showCorrect ? 'text-[#00FFA3]' :
                        showIncorrect ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {word}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Feedback */}
          {allSelected && !isCorrect && (
            <WalletAlert variant="danger">
              Some words are incorrect. Please review your seed phrase and try again.
            </WalletAlert>
          )}

          {allSelected && isCorrect && (
            <WalletAlert variant="success" title="Verification Successful!">
              You've correctly verified your seed phrase. Your wallet is ready to be created.
            </WalletAlert>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 mt-6">
          <WalletButton
            onClick={handleVerify}
            icon={ArrowRight}
            disabled={!allSelected}
          >
            Continue
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back to Seed Phrase
          </WalletButton>
        </div>
      </div>
    </div>
  );
}