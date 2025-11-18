import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface WalletInputProps {
  label: string;
  type?: 'text' | 'password' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
}

export function WalletInput({ 
  label, 
  type = 'text', 
  value, 
  onChange, 
  placeholder,
  error,
  required = false
}: WalletInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <label className="text-sm text-gray-300 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-[#00FFA3]">*</span>}
      </label>
      <div className="relative">
        <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 rounded-lg blur-sm"></div>
        <div className="relative">
          <input
            type={inputType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/5 backdrop-blur-lg border border-white/10 focus:border-[#00FFA3] text-white px-4 py-3 rounded-lg outline-none transition-all placeholder:text-gray-500"
          />
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#00FFA3] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-2">
          <span className="w-1 h-1 bg-red-400 rounded-full"></span>
          {error}
        </p>
      )}
    </div>
  );
}
