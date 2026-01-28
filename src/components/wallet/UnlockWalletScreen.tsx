import { Lock, ArrowRight, Key, XCircle, Shield, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { WalletButton } from './WalletButton';
import { getEncryptedWallet, getUnlockAttempts, isUnlockBlocked } from '../../utils/walletCrypto';
import { useWallet } from '../../features/wallet/context/WalletProvider';

interface UnlockWalletScreenProps {
  onUnlocked: (publicKey: string) => void;
  onBack: () => void;
  onRecoveryMethod: () => void;
}

export function UnlockWalletScreen({ onUnlocked, onBack, onRecoveryMethod }: UnlockWalletScreenProps) {
  const { unlock } = useWallet();
  const hasUnlockedBefore =
    typeof window !== 'undefined' && localStorage.getItem('reflex_has_unlocked_wallet') === 'true';
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const MAX_ATTEMPTS = 5;
  const isPasswordLocked = isUnlockBlocked(failedAttempts);

  useEffect(() => {
    getUnlockAttempts().then(setFailedAttempts).catch(() => setFailedAttempts(0));
    getEncryptedWallet()
      .then((record) => {
        if (!record) {
          setErrorMessage('No wallet found. Please recover your wallet or create a new one.');
        }
      })
      .catch(() => {
        setErrorMessage('No wallet found. Please recover your wallet or create a new one.');
      });
  }, []);

  const handleUnlock = async () => {
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
      const { publicKey } = await unlock(password);

      if (hasUnlockedBefore) {
        toast.success('Wallet Unlocked', {
          description: 'Welcome back to Reflex Arena',
          style: { background: '#0B0F1A', border: '1px solid #00FFA3', color: 'white' }
        });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('reflex_has_unlocked_wallet', 'true');
      }

      onUnlocked(publicKey);
    } catch (err: any) {
      console.error('Unlock failed:', err);
      const msg = err?.message || 'Unknown error';
      const normalizedMessage = msg.toLowerCase();

      if (normalizedMessage.includes('password') || normalizedMessage.includes('decrypt') || normalizedMessage.includes('mac check failed')) {
        setErrorMessage('Incorrect password. Please try again.');
        setFailedAttempts((prev) => prev + 1);
        setPassword('');

        toast.error('Access Denied', {
          description: 'The password provided is incorrect.',
          style: { background: '#0B0F1A', border: '1px solid #EF4444', color: 'white' }
        });
      } else if (
        normalizedMessage.includes('nonce') ||
        normalizedMessage.includes('missing') ||
        normalizedMessage.includes('corrupted') ||
        normalizedMessage.includes('unexpected token')
      ) {
        toast.error('Wallet Integrity Error', {
          description: 'Local data is corrupted or expired. Redirecting to recovery...',
          duration: 5000,
          style: { background: '#0B0F1A', border: '1px solid #F97316', color: 'white' }
        });

        setTimeout(() => {
          onRecoveryMethod();
        }, 2000);
      } else if (normalizedMessage.includes('no wallet found')) {
        setErrorMessage('No wallet found. Please recover your wallet or create a new one.');
      } else {
        setErrorMessage('Failed to unlock. Please try recovering your wallet.');
        toast.error('Unlock Failed', { description: msg });
      }
    } finally {
      setUnlocking(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isPasswordLocked && password.length >= 8) {
      handleUnlock();
    }
  };

  const canUnlock = password.length >= 8 && !isPasswordLocked;

  return (
    <div id="page-root" className="min-h-screen bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] px-4 pt-4 pb-3 md:px-6 md:pt-6 md:pb-4 relative overflow-x-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#00FFA3] opacity-10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md w-full mx-auto flex flex-col min-h-[calc(100vh-1.75rem)] md:min-h-[75vh] py-5 gap-4">
        {/* Header */}
        <div className="text-center mb-4 md:mb-6">
          {/* Icon with glow effect */}
          <div className="relative inline-block mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00FFA3] to-[#06B6D4] blur-2xl opacity-50"></div>
            <div className="relative inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#00FFA3] to-[#06B6D4]">
              <Lock className="w-10 h-10 md:w-12 md:h-12 text-[#0B0F1A]" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl text-white mb-1">Unlock Wallet</h1>
          <p className="text-sm md:text-base text-gray-400">Access your secure Web3 wallet</p>
        </div>

        <div className="flex-1 space-y-4">
          {/* Password unlock */}
          <div className="space-y-3">
            {/* Password locked warning */}
            {isPasswordLocked && (
              <div className="relative">
                  <div className="absolute -inset-px bg-gradient-to-br from-red-500/30 to-orange-500/30 blur-sm rounded-xl"></div>
                  <div className="relative bg-red-500/10 backdrop-blur-lg border border-red-500/30 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white mb-1">Password Locked</h4>
                        <p className="text-sm text-red-300 leading-relaxed">
                          Too many failed attempts. Please use your seed phrase to recover your wallet.
                        </p>
                      </div>
                    </div>
                  </div>
              </div>
            )}

            {/* Error message for failed attempts */}
            {errorMessage && !isPasswordLocked && (
                <div className="relative">
                  <div className="absolute -inset-px bg-gradient-to-br from-red-500/30 to-orange-500/30 blur-sm rounded-lg"></div>
                  <div className="relative bg-red-500/10 backdrop-blur-lg border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-300 leading-relaxed">{errorMessage}</p>
                    </div>
                  </div>
                </div>
            )}

            {/* Password input */}
            <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm text-gray-400 uppercase tracking-widest">
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
                      className={`relative w-full bg-white/5 backdrop-blur-lg border ${isPasswordLocked ? 'border-red-500/30 cursor-not-allowed' : 'border-white/10 focus:border-[#00FFA3]'} text-white pl-12 pr-12 py-3 rounded-xl outline-none transition-all placeholder:text-gray-500 disabled:opacity-50`}
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
                  <p className="text-[11px] text-gray-400">
                    Minimum 8 characters required
                  </p>
                )}
            </div>

            {/* Unlock button */}
              <WalletButton 
              onClick={handleUnlock}
              icon={ArrowRight}
              disabled={!canUnlock || unlocking}
              fullWidth
            >
              {unlocking ? 'Unlocking...' : isPasswordLocked ? 'Password Locked' : 'Unlock Wallet'}
            </WalletButton>
          </div>

          {/* Recovery options */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-xs md:text-sm text-gray-500 uppercase tracking-wider">Need Help?</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Recovery methods info */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#00FFA3]/20 blur-sm rounded-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#06B6D4]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white mb-1 text-sm">Forgot Password?</h4>
                  <p className="text-[11px] md:text-xs text-gray-400 leading-relaxed">
                    Recover your wallet using your seed phrase
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:gap-3">
                <button
                  onClick={onRecoveryMethod}
                  className="bg-[#06B6D4]/10 hover:bg-[#06B6D4]/20 border border-[#06B6D4]/30 hover:border-[#06B6D4]/50 text-[#06B6D4] px-3.5 py-2.5 rounded-lg transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Key className="w-5 h-5" />
                  <span className="text-[11px] md:text-xs">Seed Phrase</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <div className="mt-6 pt-1">
          <WalletButton onClick={onBack} variant="secondary" fullWidth>
            Back to Welcome
          </WalletButton>
        </div>
      </div>
    </div>
  );
}
