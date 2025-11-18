import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { copyToClipboard } from '../../utils/clipboard';

interface AddressCopyProps {
  address: string;
  showFull?: boolean;
}

export function AddressCopy({ address, showFull = false }: AddressCopyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayAddress = showFull 
    ? address 
    : `${address.slice(0, 6)}...${address.slice(-6)}`;

  return (
    <div className="relative">
      <div className="absolute -inset-px bg-gradient-to-r from-[#00FFA3]/20 to-[#06B6D4]/20 blur-sm rounded-lg"></div>
      <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4 flex items-center justify-between gap-3">
        <code className="text-[#00FFA3] break-all">{displayAddress}</code>
        <button
          onClick={handleCopy}
          className="flex-shrink-0 bg-white/5 hover:bg-[#00FFA3]/20 border border-white/10 hover:border-[#00FFA3] p-2 rounded-lg transition-all"
        >
          {copied ? (
            <Check className="w-5 h-5 text-[#00FFA3]" />
          ) : (
            <Copy className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}