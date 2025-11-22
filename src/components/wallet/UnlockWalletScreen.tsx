import { Lock, Fingerprint, ArrowRight, FileJson, Key, XCircle, Shield, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WalletButton } from './WalletButton';
import { getEncryptedWallet, getUnlockAttempts, isUnlockBlocked } from '../../utils/walletCrypto';
import { useWallet } from '../../features/wallet/context/WalletProvider';
import { biometricsUtils } from '../../utils/biometrics';
import { WalletStepLayout } from './WalletStepLayout';

interface UnlockWalletScreenProps {
  onUnlocked: () => void;
  onBack: () => void;
  onRecoveryMethod: () => void;
}

export function UnlockWalletScreen({ onUnlocked, onBack, onRecoveryMethod }: UnlockWalletScreenProps) {
  const { unlock } = useWallet();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricCredentialId, setBiometricCredentialId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [biometricVerified, setBiometricVerified] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const MAX_ATTEMPTS = 5;
  const isPasswordLocked = isUnlockBlocked(failedAttempts);

  useEffect(() => {
    getUnlockAttempts().then(setFailedAttempts).catch(() => setFailedAttempts(0));
    (async () => {
      try {
        const [available, record] = await Promise.all([
          biometricsUtils.isBiometricAvailable(),
          getEncryptedWallet()
        ]);
        if (record?.publicKey) {
          setWalletId(record.publicKey);
        }
        if (available && record?.biometricEnabled && record.biometricCredentialId) {
          setBiometricCredentialId(record.biometricCredentialId);
          setBiometricAvailable(true);
        } else {
          setBiometricAvailable(false);
        }
      } catch (error) {
        console.error('Unable to check biometric support', error);
        setBiometricAvailable(false);
      }
    })();
  }, []);

  const handleBiometricUnlock = async () => {
    if (!password) {
      setErrorMessage('Enter your password to complete biometric unlock');
      return;
    }

    if (!biometricAvailable || !biometricCredentialId || !walletId) {
      setErrorMessage('Biometric unlock is not available on this device.');
      return;
    }

    setUnlocking(true);
    setErrorMessage('');

    try {
      const verified = await biometricsUtils.verifyBiometricCredential(walletId, biometricCredentialId);
      if (!verified) {
        setUnlocking(false);
        setErrorMessage('Biometric verification failed. Please try again or use your password.');
        return;
      }

      await unlock(password);
      setBiometricVerified(true);
      setUnlocking(false);
      setTimeout(() => {
        onUnlocked();
      }, 500);
    } catch (error) {
      const updatedAttempts = await getUnlockAttempts().catch(() => failedAttempts);
      setFailedAttempts(updatedAttempts);
      setUnlocking(false);
      setErrorMessage(error instanceof Error ? error.message : 'Unable to unlock wallet');
    }
  };

  const handlePasswordUnlock = async () => {
    if (isPasswordLocked) {
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters');
      return;
    }

    setUnlocking(true);
    setErrorMessage('');

    try {
      await unlock(password);
      setUnlocking(false);
      onUnlocked();
    } catch (error) {
      setUnlocking(false);
      const newAttempts = await getUnlockAttempts();
      setFailedAttempts(newAttempts);
      setPassword('');

      if (isUnlockBlocked(newAttempts)) {
        setErrorMessage('Wallet locked due to too many failed attempts. Use recovery options below.');
      } else {
        setErrorMessage(`Incorrect password. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPasswordLocked && password.length >= 8) {
      handlePasswordUnlock();
    }
  };

  const canUnlock = password.length >= 8 && !isPasswordLocked;

  return (
    <WalletStepLayout
      title="Unlock Wallet"
      subtitle="Access your secure Web3 wallet"
      icon={(
        <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4]">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-2xl opacity-50"></div>
          <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-[#0B0F1A] relative" />
        </div>
      )}
      background={(
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-1/4 left-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
        </div>
      )}
      actions={(
        !biometricVerified ? (
          <div className="space-y-2 sm:space-y-3">
            <WalletButton
              onClick={handlePasswordUnlock}
              icon={ArrowRight}
              disabled={!canUnlock || unlocking || isPasswordLocked}
            >
              {unlocking ? 'Unlocking...' : isPasswordLocked ? 'Password Locked' : 'Unlock Wallet'}
            </WalletButton>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <WalletButton onClick={onRecoveryMethod} variant="secondary">
                Recover Wallet
              </WalletButton>
              <WalletButton onClick={onBack} variant="secondary">
                Back to Welcome
              </WalletButton>
            </div>
          </div>
        ) : (
          <WalletButton icon={ArrowRight} disabled>
            Redirecting...
          </WalletButton>
        )
      )}
    >
      <div className="space-y-3 sm:space-y-6">
        {biometricAvailable && !biometricVerified && !isPasswordLocked && (
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#7C3AED]/30 to-[#00FFA3]/30 blur-sm rounded-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#00FFA3]/20 border border-[#7C3AED]/30 flex items-center justify-center">
                  <Fingerprint className="w-7 h-7 sm:w-8 sm:h-8 text-[#7C3AED]" />
                </div>
                <h3 className="text-white text-lg">Quick Unlock</h3>
                <p className="text-sm text-gray-400">
                  Use biometric authentication for faster access
                </p>
                <button
                  onClick={handleBiometricUnlock}
                  disabled={unlocking}
                  className="w-full bg-gradient-to-r from-[#7C3AED] to-[#00FFA3] hover:from-[#6B2FD6] hover:to-[#00D989] text-white px-5 py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  <Fingerprint className="w-5 h-5" />
                  <span>{unlocking ? 'Authenticating...' : 'Unlock with Biometrics'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {biometricVerified && (
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#00FFA3]/30 to-green-500/30 blur-sm rounded-xl"></div>
            <div className="relative bg-[#00FFA3]/10 backdrop-blur-lg border border-[#00FFA3]/30 rounded-xl p-5 sm:p-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#00FFA3]/20 border border-[#00FFA3]/30 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-[#00FFA3]" />
                </div>
                <h3 className="text-white text-lg">Authentication Successful</h3>
                <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
              </div>
            </div>
          </div>
        )}

        {!biometricVerified && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">or use password</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        )}

        {!biometricVerified && (
          <div className="space-y-3 sm:space-y-4">
            {isPasswordLocked && (
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-br from-red-500/30 to-orange-500/30 blur-sm rounded-xl"></div>
                <div className="relative bg-red-500/10 backdrop-blur-lg border border-red-500/30 rounded-xl p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h4 className="text-white text-sm sm:text-base">Password Locked</h4>
                      <p className="text-xs sm:text-sm text-red-300 leading-relaxed">
                        Too many failed attempts. Please use your seed phrase or JSON backup file to recover your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && !isPasswordLocked && (
              <div className="relative">
                <div className="absolute -inset-px bg-gradient-to-br from-red-500/30 to-orange-500/30 blur-sm rounded-lg"></div>
                <div className="relative bg-red-500/10 backdrop-blur-lg border border-red-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-300">{errorMessage}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm text-gray-400 uppercase tracking-widest">
                  Password
                </label>
                {failedAttempts > 0 && !isPasswordLocked && (
                  <span className="text-xs text-orange-400">
                    {MAX_ATTEMPTS - failedAttempts} attempt{MAX_ATTEMPTS - failedAttempts === 1 ? '' : 's'} left
                  </span>
                )}
              </div>

              <div className="relative">
                <div className={`absolute -inset-px ${isPasswordLocked ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20' : 'bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20'} rounded-xl blur-sm`}></div>
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isPasswordLocked ? 'text-red-400' : 'text-gray-400'} z-10`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => !isPasswordLocked && setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isPasswordLocked ? 'Use recovery methods below' : 'Enter your password'}
                    disabled={isPasswordLocked}
                    className={`relative w-full bg-white/5 backdrop-blur-lg border ${isPasswordLocked ? 'border-red-500/30 cursor-not-allowed' : 'border-white/10 focus:border-[#00FFA3]'} text-white pl-12 pr-12 py-3 rounded-xl outline-none transition-all placeholder:text-gray-500 disabled:opacity-50 text-sm sm:text-base`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isPasswordLocked}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {!isPasswordLocked && (
                <p className="text-xs text-gray-400">Minimum 8 characters required</p>
              )}
            </div>
          </div>
        )}

        {!biometricVerified && (
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">Need Help?</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>
        )}

        {!biometricVerified && (
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#00FFA3]/20 blur-sm rounded-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-white text-sm sm:text-base">Forgot Password?</h4>
                  <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                    Recover your wallet using your seed phrase or JSON backup file
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <button
                  onClick={onRecoveryMethod}
                  className="bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 hover:border-[#06B6D4]/50 text-[#06B6D4] px-4 py-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <Key className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Seed Phrase</span>
                </button>
                <button
                  onClick={onRecoveryMethod}
                  className="bg-[#00FFA3]/10 hover:bg-[#00FFA3]/20 border border-[#00FFA3]/30 hover:border-[#00FFA3]/50 text-[#00FFA3] px-4 py-3 rounded-lg transition-all flex flex-col items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <FileJson className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>JSON File</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </WalletStepLayout>
  );
}