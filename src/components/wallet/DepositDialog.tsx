import { ArrowDownToLine, Copy, QrCode, X } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { AddressCopy } from './AddressCopy';
import { QRPanel } from './QRPanel';
import { WalletAlert } from './WalletAlert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}

export function DepositDialog({ open, onClose, walletAddress }: DepositDialogProps) {
  const [network, setNetwork] = useState<'devnet' | 'mainnet'>('devnet');
  const [showQR, setShowQR] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border-2 border-[#00FFA3]/20 w-[calc(100%-2rem)] max-w-md">
        {/* Custom Close Button - More Visible */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-50 bg-white/10 hover:bg-red-500/80 border border-white/20 hover:border-red-500 rounded-lg p-2 transition-all duration-300 group"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5 text-white group-hover:text-white transition-colors" />
        </button>

        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-white text-xl">
            <div className="p-2 bg-[#00FFA3]/20 rounded-lg">
              <ArrowDownToLine className="w-5 h-5 text-[#00FFA3]" />
            </div>
            Deposit SOL
          </DialogTitle>
          <DialogDescription className="sr-only">
            Deposit SOL to your wallet by copying your address or scanning the QR code
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Network selector */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 uppercase tracking-wider">Network</label>
            <Select value={network} onValueChange={(val) => setNetwork(val as 'devnet' | 'mainnet')}>
              <SelectTrigger className="w-full bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1f2e] border-white/10">
                <SelectItem value="devnet" className="text-white hover:bg-white/10">
                  Devnet (Testing)
                </SelectItem>
                <SelectItem value="mainnet" className="text-white hover:bg-white/10">
                  Mainnet (Real SOL)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Wallet address */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300 uppercase tracking-wider">Your Deposit Address</label>
            <AddressCopy address={walletAddress} showFull={false} />
          </div>

          {/* QR Code Toggle */}
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#00FFA3]/50 text-white p-4 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            <QrCode className="w-5 h-5" />
            <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
          </button>

          {showQR && (
            <div className="flex justify-center py-4">
              <QRPanel data={walletAddress} size={200} />
            </div>
          )}

          {/* Instructions */}
          <div className="relative">
            <div className="absolute -inset-px bg-gradient-to-br from-[#06B6D4]/20 to-[#7C3AED]/20 blur-sm rounded-lg"></div>
            <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-lg p-4">
              <h3 className="text-white mb-3 flex items-center gap-2">
                <Copy className="w-4 h-4 text-[#00FFA3]" />
                How to Deposit
              </h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3] flex-shrink-0">1.</span>
                  <span>Copy your wallet address or scan QR code</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3] flex-shrink-0">2.</span>
                  <span>Open your exchange or another Solana wallet</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3] flex-shrink-0">3.</span>
                  <span>Send SOL to this address on {network}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FFA3] flex-shrink-0">4.</span>
                  <span>Wait for blockchain confirmation</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Warning */}
          <WalletAlert variant="warning">
            Only send SOL on the {network} network. Sending tokens from other networks may result in loss of funds.
          </WalletAlert>
        </div>
      </DialogContent>
    </Dialog>
  );
}