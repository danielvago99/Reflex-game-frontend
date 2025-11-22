import { Lock, ArrowRight, Fingerprint, Info, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { WalletButton } from './WalletButton';
import { WalletInput } from './WalletInput';
import { WalletAlert } from './WalletAlert';
import { Checkbox } from '../ui/checkbox';
import { Switch } from '../ui/switch';
import { getPasswordStrength } from '../../utils/walletCrypto';

interface SetPasswordScreenProps {
  onContinue: (password: string, biometric: boolean) => void;
  onBack: () => void;
}

export function SetPasswordScreen({ onContinue, onBack }: SetPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [understand, setUnderstand] = useState(false);
  const [biometric, setBiometric] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = password ? getPasswordStrength(password) : null;

  const validatePassword = () => {
    const newErrors = { password: '', confirm: '' };
    
    if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirm = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return !newErrors.password && !newErrors.confirm;
  };

  const handleContinue = () => {
    if (validatePassword() && understand) {
      onContinue(password, biometric);
    }
  };

  const canContinue = password.length >= 8 && password === confirmPassword && understand;

  // Get strength bar color
  const getStrengthColor = () => {
    if (!passwordStrength) return 'from-gray-500 to-gray-600';
    switch (passwordStrength.level) {
      case 'weak': return 'from-red-500 to-red-600';
      case 'medium': return 'from-yellow-500 to-yellow-600';
      case 'strong': return 'from-[#06B6D4] to-[#00FFA3]';
      case 'very-strong': return 'from-[#00FFA3] to-green-500';
    }
  };

  const getStrengthText = () => {
    if (!passwordStrength) return '';
    switch (passwordStrength.level) {
      case 'weak': return 'Weak';
      case 'medium': return 'Medium';
      case 'strong': return 'Strong';
      case 'very-strong': return 'Very Strong';
    }
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-gradient-to-br from-[#0B0F1A] via-[#101522] to-[#1a0f2e] p-6 p-safe pb-safe pt-safe relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/2 w-96 h-96 bg-[#7C3AED] opacity-10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 max-w-md mx-auto flex flex-col flex-1 py-8 pb-32">
        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 uppercase tracking-widest">Step 2 of 5</span>
            <span className="text-xs text-[#00FFA3]">40%</span>
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00FFA3] to-[#06B6D4] w-2/5 transition-all duration-500"></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] mb-4 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] blur-xl opacity-50"></div>
            <Lock className="w-10 h-10 text-white relative" />
          </div>
          <h1 className="text-3xl text-white mb-2">Set Password</h1>
          <p className="text-gray-400">Protect your wallet with a strong password</p>
        </div>

        <div className="flex-1 space-y-6">
          {/* Password info */}
          <div className="relative bg-white/5 backdrop-blur-lg border border-[#00FFA3]/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#00FFA3] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-white text-sm mb-1">Local Encryption Only</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your password encrypts your wallet locally on this device. You'll need your seed phrase to recover your wallet on other devices.
                </p>
              </div>
            </div>
          </div>

          {/* Password fields */}
          <div className="space-y-4">
            <div className="relative">
              <WalletInput
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                error={errors.password}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="relative">
              <WalletInput
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                error={errors.confirm}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Enhanced Password strength indicator */}
          {password.length > 0 && passwordStrength && (
            <div className="space-y-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Password Strength</span>
                <span className={`${
                  passwordStrength.level === 'weak' ? 'text-red-400' :
                  passwordStrength.level === 'medium' ? 'text-yellow-400' :
                  passwordStrength.level === 'strong' ? 'text-[#06B6D4]' :
                  'text-[#00FFA3]'
                }`}>
                  {getStrengthText()}
                </span>
              </div>
              
              {/* Animated strength bar */}
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getStrengthColor()} transition-all duration-500`}
                  style={{ width: `${passwordStrength.score}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>

              {/* Feedback */}
              {passwordStrength.feedback.length > 0 && (
                <div className="space-y-1">
                  {passwordStrength.feedback.map((tip, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                      <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Checkboxes */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <Checkbox 
                checked={understand}
                onCheckedChange={(checked) => setUnderstand(checked as boolean)}
                className="mt-0.5 border-white/30 data-[state=checked]:bg-[#00FFA3] data-[state=checked]:border-[#00FFA3]"
              />
              <label className="text-sm text-gray-300 leading-relaxed flex-1 cursor-pointer" onClick={() => setUnderstand(!understand)}>
                I understand that I need my <span className="text-[#00FFA3]">seed phrase</span> to recover my wallet if I forget this password or lose access to this device.
              </label>
            </div>

            {/* Biometric option */}
            <div className="flex items-center justify-between bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="w-5 h-5 text-[#00FFA3]" />
                <div>
                  <p className="text-white text-sm">Enable Biometric Unlock</p>
                  <p className="text-xs text-gray-400">Use fingerprint or face ID</p>
                </div>
              </div>
              <Switch 
                checked={biometric}
                onCheckedChange={setBiometric}
              />
            </div>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 left-0 right-0 p-safe pb-safe bg-gradient-to-t from-[#0B0F1A] to-transparent backdrop-blur-lg z-50">
        <div className="max-w-sm mx-auto space-y-3 pb-6">
          <WalletButton
            onClick={handleContinue}
            icon={ArrowRight}
            disabled={!canContinue}
          >
            Continue
          </WalletButton>
          <WalletButton onClick={onBack} variant="secondary">
            Back
          </WalletButton>
        </div>
      </div>
    </div>
  );
}