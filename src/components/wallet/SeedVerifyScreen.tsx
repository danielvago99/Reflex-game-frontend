import { CheckCircle, ArrowRight, Shield, X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WalletButton } from './WalletButton';
import { WalletAlert } from './WalletAlert';
import { WalletStepLayout } from './WalletStepLayout';

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
    <WalletStepLayout
      title="Verify Seed Phrase"
      subtitle="Confirm you saved it correctly"
      step={4}
      totalSteps={5}
      icon={(
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-xl opacity-50 animate-pulse"></div>
          <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white relative" />
        </div>
      )}
      background={(
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 right-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
        </div>
      )}
      actions={(
        <>
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
        </>
      )}
    >
      <div className="space-y-3 sm:space-y-6">
        <WalletAlert variant="info">
          Select the correct words from your seed phrase to verify you've saved it properly.
        </WalletAlert>

        {randomIndices.map((index) => (
          <div key={index} className="space-y-2 sm:space-y-3">
            <label className="text-white flex items-center gap-2 text-sm sm:text-base">
              Word #{index + 1}
              {selectedWords[index] === seedPhrase[index] && (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FFA3]" />
              )}
            </label>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {shuffledOptions.map((word, idx) => {
                const isSelected = selectedWords[index] === word;
                const isCorrectWord = word === seedPhrase[index];
                const showCorrect = isSelected && isCorrectWord;
                const showIncorrect = isSelected && !isCorrectWord;

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectWord(index, word)}
                    className={`relative p-3 sm:p-4 rounded-lg border-2 transition-all text-sm sm:text-base ${
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
    </WalletStepLayout>
  );
}